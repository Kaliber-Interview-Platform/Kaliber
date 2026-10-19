import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/axios.js";
import useAuth from "../hooks/UseAuth.js";
import NavBar from "../components/NavBar.jsx";
import JobCard from "../components/JobCard.jsx";
import Loader from "../components/Loader.jsx";

// Landing hero component shown to unauthenticated visitors
function Landing() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 lg:py-20 grid gap-10 lg:grid-cols-2 items-center">
      <div>
        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-4">
          Hiring Platform for CS Graduates
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
          Hire CS graduates on how they solve problems.
        </h1>
        <p className="mt-5 text-lg opacity-80 max-w-prose leading-relaxed">
          Post roles, review applicant profiles, and assign timed coding tests.
          Every solution is auto-graded with real test cases, giving you objective
          skills evaluation instead of resume guesswork.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link to="/signup" className="btn btn-primary btn-lg shadow-md">
            Get Started Free
          </Link>
          <Link to="/login" className="btn btn-outline btn-lg">
            Sign In
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-4 border-t border-base-300 pt-6 text-center sm:text-left">
          <div>
            <div className="text-2xl font-black text-primary">100%</div>
            <div className="text-xs opacity-70">Automated Grading</div>
          </div>
          <div>
            <div className="text-2xl font-black text-secondary">Timed</div>
            <div className="text-xs opacity-70">DSA Test Sessions</div>
          </div>
          <div>
            <div className="text-2xl font-black text-accent">1-Click</div>
            <div className="text-xs opacity-70">Candidate Apply</div>
          </div>
        </div>
      </div>

      <div className="mockup-code w-full shadow-xl border border-base-300">
        <pre data-prefix="1"><code>def two_sum(nums, target):</code></pre>
        <pre data-prefix="2"><code>    seen = dict()</code></pre>
        <pre data-prefix="3"><code>    for i, n in enumerate(nums):</code></pre>
        <pre data-prefix="4"><code>        if target - n in seen:</code></pre>
        <pre data-prefix="5"><code>            return [seen[target - n], i]</code></pre>
        <pre data-prefix="6"><code>        seen[n] = i</code></pre>
        <pre data-prefix="7"><code>    return []</code></pre>
        <pre data-prefix=">" className="text-success font-semibold"><code>✓ 4 of 4 test cases passed in 12ms</code></pre>
      </div>
    </div>
  );
}

// Job board component shown to logged-in users
function JobBoard() {
  const { user, isAdmin, isCandidate } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [notice, setNotice] = useState(null);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const myId = user?._id || user?.id;

  const canManage = (job) =>
    isAdmin && (job.postedBy?._id || job.postedBy) === myId;

  const loadData = async () => {
    try {
      const [jobsRes, appsRes] = await Promise.allSettled([
        api.get("/api/jobs"),
        isCandidate ? api.get("/api/applications/mine") : Promise.resolve({ data: { applications: [] } })
      ]);

      if (jobsRes.status === "fulfilled") {
        const list = Array.isArray(jobsRes.value.data)
          ? jobsRes.value.data
          : jobsRes.value.data.jobPosts || jobsRes.value.data.jobs || [];
        setJobs(list);
      } else {
        setError(jobsRes.reason?.response?.data?.message || "Could not load job posts.");
      }

      if (appsRes.status === "fulfilled") {
        setMyApplications(appsRes.value.data?.applications || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isCandidate]);

  const showNotice = (type, text) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 3500);
  };

  const handleApply = async (jobId) => {
    try {
      await api.post(`/api/applications/${jobId}/apply`);
      showNotice("success", "Application submitted successfully!");
      // Refresh applications to update button state
      const res = await api.get("/api/applications/mine");
      setMyApplications(res.data.applications || []);
    } catch (err) {
      showNotice("error", err.response?.data?.message || "Could not submit your application.");
    }
  };

  const confirmDelete = async () => {
    if (!jobToDelete) return;
    setDeleting(true);

    try {
      await api.delete(`/api/jobs/${jobToDelete._id}`);
      setJobs((prev) => prev.filter((j) => j._id !== jobToDelete._id));
      showNotice("success", "Job post deleted.");
    } catch (err) {
      showNotice("error", err.response?.data?.message || "Could not delete job post.");
    } finally {
      setDeleting(false);
      setJobToDelete(null);
    }
  };

  const appliedJobIds = new Set(
    myApplications.map((app) => (typeof app.jobPost === "object" ? app.jobPost?._id : app.jobPost))
  );

  const query = search.trim().toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const visibleJobs = jobs.filter((job) => {
    if (isCandidate) {
      if (job.status !== "open") return false;
      if (job.deadline && new Date(job.deadline) < today) return false;
    }

    if (difficultyFilter !== "all" && job.difficultyLevel !== difficultyFilter) {
      return false;
    }

    if (typeFilter !== "all" && job.typeOfEmployment !== typeFilter) {
      return false;
    }

    return (
      !query ||
      job.title?.toLowerCase().includes(query) ||
      job.company?.toLowerCase().includes(query) ||
      job.requiredSkills?.some((skill) => skill.toLowerCase().includes(query))
    );
  });

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 py-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Explore Opportunities</h1>
          <p className="text-sm opacity-70 mt-1">
            {isCandidate
              ? "Browse open tech positions and apply directly with your profile."
              : "Manage your active job postings and candidate pipelines."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <Link to="/admin/jobs/new" className="btn btn-primary btn-sm">
              + Post New Job
            </Link>
          )}
          {isCandidate && (
            <Link to="/applications/mine" className="btn btn-outline btn-sm">
              My Applications ({myApplications.length})
            </Link>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 bg-base-100 p-4 rounded-xl border border-base-300 shadow-xs">
        <input
          type="text"
          className="input w-full"
          placeholder="Search by title, company, or skill..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="select w-full"
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          aria-label="Filter by test difficulty"
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <select
          className="select w-full"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filter by employment type"
        >
          <option value="all">All Employment Types</option>
          <option value="job">Full-time Job</option>
          <option value="internship">Internship</option>
        </select>

        <div className="flex items-center justify-end text-xs opacity-70 px-2 font-medium">
          Showing {visibleJobs.length} of {jobs.length} jobs
        </div>
      </div>

      {loading && <Loader message="Loading job listings..." />}

      {error && (
        <div role="alert" className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && visibleJobs.length === 0 && (
        <div className="card bg-base-100 border border-base-300 p-8 text-center my-6">
          <p className="text-lg font-bold">No job postings found</p>
          <p className="text-sm opacity-70 mt-1">
            {jobs.length === 0
              ? "There are currently no job postings. Check back later!"
              : "No positions matched your search criteria. Try adjusting filters."}
          </p>
        </div>
      )}

      {/* Job Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {visibleJobs.map((job) => (
          <JobCard
            key={job._id}
            job={job}
            canApply={isCandidate}
            hasApplied={appliedJobIds.has(job._id)}
            canManage={canManage(job)}
            onApply={handleApply}
            onEdit={(id) => navigate(`/admin/jobs/${id}/edit`)}
            onDelete={setJobToDelete}
          />
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {jobToDelete && (
        <dialog className="modal modal-open" aria-labelledby="delete-title">
          <div className="modal-box">
            <h3 id="delete-title" className="text-lg font-bold">
              Delete Job Post?
            </h3>
            <p className="py-3 text-sm opacity-85">
              "{jobToDelete.title}" at {jobToDelete.company} will be permanently removed,
              along with all submitted applications and tests. This action cannot be undone.
            </p>
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setJobToDelete(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-error"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* Toast Notice */}
      {notice && (
        <div className="toast toast-end z-50">
          <div
            className={`alert ${
              notice.type === "success" ? "alert-success" : "alert-error"
            } shadow-lg`}
          >
            <span>{notice.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function HomePage() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col">
        <NavBar />
        <Loader message="Loading Kaliber..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      <NavBar />
      <main className="flex-1">
        {isAuthenticated ? <JobBoard /> : <Landing />}
      </main>
    </div>
  );
}

export default HomePage;
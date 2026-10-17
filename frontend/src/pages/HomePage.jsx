import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/axios.js";

// reads the session saved by the login/signup pages
const getSession = () => {
  const token = localStorage.getItem("token");
  try {
    return { token, user: JSON.parse(localStorage.getItem("user")) };
  } catch {
    return { token, user: null };
  }
};

// shown to visitors who are not logged in
function Landing() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 lg:py-20 grid gap-10 lg:grid-cols-2 items-center">
      <div>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
          Hire CS graduates on how they solve problems
        </h1>
        <p className="mt-5 text-lg opacity-80 max-w-prose">
          Post a role, shortlist applicants, and send each one a timed coding test.
          Every answer is graded automatically, so you review a score and the
          submitted code instead of a stack of resumes.
        </p>
        <div className="mt-8 flex gap-3">
          <Link to="/signup" className="btn btn-primary">
            Create an account
          </Link>
          <Link to="/login" className="btn btn-ghost">
            Log in
          </Link>
        </div>
      </div>

      <div className="mockup-code w-full">
        <pre data-prefix="1"><code>def two_sum(nums, target):</code></pre>
        <pre data-prefix="2"><code>    seen = dict()</code></pre>
        <pre data-prefix="3"><code>    for i, n in enumerate(nums):</code></pre>
        <pre data-prefix="4"><code>        if target - n in seen:</code></pre>
        <pre data-prefix="5"><code>            return seen[target - n], i</code></pre>
        <pre data-prefix="6"><code>        seen[n] = i</code></pre>
        <pre data-prefix=">" className="text-success"><code>2 of 2 test cases passed</code></pre>
      </div>
    </div>
  );
}

function JobCard({ job, canApply, onApply }) {
  const closed = job.status === "closed";
  const experience =
    job.maxExperience != null
      ? `${job.minExperience ?? 0} to ${job.maxExperience} years`
      : `${job.minExperience ?? 0}+ years`;

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="card-title">{job.title}</h3>
          <span className={`badge ${closed ? "badge-ghost" : "badge-success badge-soft"}`}>
            {closed ? "Closed" : "Open"}
          </span>
        </div>

        <p className="text-sm opacity-80 line-clamp-3">{job.description}</p>

        <div className="flex flex-wrap gap-1">
          {job.requiredSkills?.map((skill) => (
            <span key={skill} className="badge badge-outline badge-sm">
              {skill}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-x-4 text-sm opacity-70">
          <span>Experience: {experience}</span>
          <span>Openings: {job.openings}</span>
          {job.deadline && <span>Apply by {new Date(job.deadline).toLocaleDateString()}</span>}
        </div>

        {canApply && (
          <div className="card-actions justify-end">
            <button
              className="btn btn-primary btn-sm"
              disabled={closed}
              onClick={() => onApply(job._id)}
            >
              Apply
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// shown to logged-in users
function JobBoard({ user, token }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState(null);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const res = await api.get("/api/jobposts", authHeaders);
        // adjust this line if your getAllJobPosts returns a different shape
        const list = Array.isArray(res.data) ? res.data : res.data.jobPosts || res.data.jobs || [];
        setJobs(list);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load job posts.");
      } finally {
        setLoading(false);
      }
    };
    loadJobs();
  }, []);

  const showNotice = (type, text) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 3500);
  };

  const handleApply = async (jobId) => {
    try {
      await api.post(`/api/applications/${jobId}/apply`, {}, authHeaders);
      showNotice("success", "Application submitted.");
    } catch (err) {
      showNotice("error", err.response?.data?.message || "Could not submit your application.");
    }
  };

  const query = search.trim().toLowerCase();
  const visibleJobs = jobs.filter(
    (job) =>
      !query ||
      job.title?.toLowerCase().includes(query) ||
      job.requiredSkills?.some((skill) => skill.toLowerCase().includes(query))
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Open positions</h1>
        <input
          type="text"
          className="input w-full sm:w-72"
          placeholder="Search by title or skill"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <span className="loading loading-spinner loading-lg" />}

      {error && (
        <div role="alert" className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && visibleJobs.length === 0 && (
        <p className="opacity-70">
          {jobs.length === 0 ? "No job posts yet." : "No job posts match your search."}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleJobs.map((job) => (
          <JobCard
            key={job._id}
            job={job}
            canApply={user.role === "candidate"}
            onApply={handleApply}
          />
        ))}
      </div>

      {notice && (
        <div className="toast toast-end">
          <div className={`alert ${notice.type === "success" ? "alert-success" : "alert-error"}`}>
            <span>{notice.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function HomePage() {
  const { token, user } = getSession();

  if (!token || !user) return <Landing />;
  return <JobBoard user={user} token={token} />;
}

export default HomePage;
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

function JobCard({ job, canApply, canManage ,onApply, onEdit, onDelete }) {
  const closed = job.status === "closed";
  const experience = `${job.yearsOfExperience ?? 0}+ years`;

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
          {job.deadline && <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>}
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

        {canManage && (
          <div className="card-actions justify-end">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => onEdit(job._id)}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn btn-outline btn-error btn-sm"
              onClick={() => onDelete(job)}
              >
              Delete
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
  const navigate = useNavigate();
  const [jobToDelete, setJobToDelete] =useState(null);
  const [deleting,setDeleting] = useState(false);
  const isAdmin = user.role ==="admin";
  const myId = user._id || user.id;

  const canManage = (job) =>
    isAdmin && (job.postedBy?._id || job.postedBy) === myId;

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const res = await api.get("/api/jobs", authHeaders);
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

  const confirmDelete = async () => {
  setDeleting(true);

  try {
    await api.delete(`/api/jobs/${jobToDelete._id}`, authHeaders);
    setJobs((prev) => prev.filter((j) => j._id !== jobToDelete._id));
    showNotice("success", "Job post deleted.");
  } catch (err) {
    showNotice("error", err.response?.data?.message || "Could not delete job post.");
  } finally {
    setDeleting(false);
    setJobToDelete(null);
  }
};

  const query = search.trim().toLowerCase();
  const today=new Date();
  today.setHours(0,0,0,0);
  const visibleJobs = jobs.filter(
    (job) =>{
      if (user.role === "candidate"){
        if (job.status !== "open") return false;
        if (job.deadline && new Date(job.deadline) < today) return false;
      }

      return (
        !query ||
        job.title?.toLowerCase().includes(query) ||
        job.requiredSkills?.some((skill) => skill.toLowerCase().includes(query))
      )
    }
);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Open positions</h1>
          <Link to="/profile" className="btn btn-outline btn-sm mt-3">
            My Profile
          </Link>
        </div>
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {visibleJobs.map((job) => (
          <JobCard
            key={job._id}
            job={job}
            canApply={user.role === "candidate"}
            canManage={canManage(job)}
            onApply={handleApply}
            onEdit={(id) => navigate(`/admin/jobs/${id}/edit`)}
            onDelete={setJobToDelete}
          />
        ))}
      </div>
      
      {jobToDelete && (
        <dialog className="modal modal-open" aria-labelledby="delete-title">
        <div className="modal-box">
          <h3 id="delete-title" className="text-lg font-bold">
            Delete this job post?
          </h3>
          <p className="py-3">
            "{jobToDelete.title}" will be removed for all candidates, along with
            its applications. This can't be undone.
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
          {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </dialog>
)}

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
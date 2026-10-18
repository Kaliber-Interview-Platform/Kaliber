import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../lib/axios.js";

const STATUS_LABELS = {
  applied: "Applied",
  shortlisted: "Shortlisted",
  test_assigned: "Test assigned",
  test_completed: "Test completed",
  selected: "Selected",
  rejected: "Rejected"
};

const STATUS_BADGES = {
  applied: "badge-info",
  shortlisted: "badge-primary",
  test_assigned: "badge-warning",
  test_completed: "badge-secondary",
  selected: "badge-success",
  rejected: "badge-error"
};

// Statuses the admin sets by hand. test_assigned and test_completed
// will be set automatically by the test flow later.
const MANUAL_STATUSES = ["shortlisted", "rejected", "selected"];

const toUrl = (value) =>
  /^https?:\/\//i.test(value) ? value : `https://${value}`;

function AdminTrackingPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [applications, setApplications] = useState([]);

  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user") || "null");
    const myId = user?._id || user?.id;

    const loadJobs = async () => {
      try {
        const res = await api.get("/api/jobs");
        const all = res.data.jobPosts || [];

        // Only this admin's own job posts
        const mine = myId
          ? all.filter((job) => (job.postedBy?._id || job.postedBy) === myId)
          : all;

        setJobs(mine);
        const fromUrl = searchParams.get("job");
        const initial = mine.find((j) => j._id === fromUrl) || mine[0];
        if (initial) setSelectedJobId(initial._id);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load job posts");

        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
      } finally {
        setLoadingJobs(false);
      }
    };

    loadJobs();
  }, [navigate]);

  useEffect(() => {
    if (!selectedJobId) return;

    let cancelled = false;

    const loadApplications = async () => {
      setLoadingApps(true);
      setError("");
      setStatusFilter("all");
      setSearch("");

      try {
        const res = await api.get(`/api/applications/jobpost/${selectedJobId}`);
        if (!cancelled) setApplications(res.data.applications || []);
      } catch (err) {
        if (!cancelled) {
          setApplications([]);
          console.error(
            "Load applications failed:",
            err.response?.status,
            err.response?.data || err.message
          );
          setError(
            err.response?.data?.message ||
              (err.response
                ? `Request failed (status ${err.response.status})`
                : "Cannot reach the server. Is the backend running?")
          );
        }
      } finally {
        if (!cancelled) setLoadingApps(false);
      }
    };

    loadApplications();

    return () => {
      cancelled = true;
    };
  }, [selectedJobId]);

  const showNotice = (text) => {
    setNotice(text);
    setTimeout(() => setNotice(""), 3000);
  };

  const handleStatusChange = async (applicationId, status) => {
    if (!status) return;

    setUpdatingId(applicationId);
    setError("");

    try {
      await api.patch(`/api/applications/${applicationId}/status`, { status });

      setApplications((prev) =>
        prev.map((app) =>
          app._id === applicationId ? { ...app, status } : app
        )
      );
      showNotice(`Status changed to ${STATUS_LABELS[status]}.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingId("");
    }
  };

  const visibleApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((app) => {
      if (statusFilter !== "all" && app.status !== statusFilter) return false;
      if (!query) return true;

      const c = app.candidate || {};
      return `${c.name || ""} ${c.email || ""}`.toLowerCase().includes(query);
    });
  }, [applications, statusFilter, search]);

  if (loadingJobs) {
    return <p className="p-8">Loading...</p>;
  }

  return (
    <div className="max-w-screen-2xl mx-auto p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="btn btn-ghost btn-sm">
            Back
          </Link>
          <h1 className="text-3xl font-bold">Applications</h1>
        </div>
      </div>

      {error && (
        <div role="alert" className="alert alert-error mb-4">
          {error}
        </div>
      )}

      {notice && (
        <div role="status" className="alert alert-success mb-4">
          {notice}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body items-center text-center">
            <p>You haven't posted any jobs yet.</p>
            <Link to="/admin/jobs/new" className="btn btn-primary btn-sm">
              Create job post
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <select
              className="select w-full"
              aria-label="Select job post"
              value={selectedJobId}
              onChange={(e) => {
                setSelectedJobId(e.target.value);
                setSearchParams({ job: e.target.value }, { replace: true });
              }}
            >
              {jobs.map((job) => (
                <option key={job._id} value={job._id}>
                  {job.title} ({job.company})
                </option>
              ))}
            </select>

            <select
              className="select w-full"
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <input
              className="input w-full"
              type="search"
              placeholder="Search by name or email"
              aria-label="Search applicants"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <p className="mb-3 text-sm opacity-70">
            {loadingApps
              ? "Loading applications..."
              : `${visibleApplications.length} of ${applications.length} applicants`}
          </p>

          {!loadingApps && applications.length === 0 && !error && (
            <div className="card bg-base-100 border border-base-300">
              <div className="card-body items-center text-center">
                <p>No one has applied to this job yet.</p>
              </div>
            </div>
          )}

          {!loadingApps && applications.length > 0 && (
            <div className="overflow-x-auto border border-base-300 rounded-box">
              <table className="table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Experience</th>
                    <th>Expected salary</th>
                    <th>Links</th>
                    <th>Applied</th>
                    <th>Status</th>
                    <th>Change status</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleApplications.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center opacity-70">
                        No applicants match your filters.
                      </td>
                    </tr>
                  )}

                  {visibleApplications.map((app) => {
                    const c = app.candidate || {};

                    return (
                      <tr key={app._id}>
                        <td>
                          {c._id ? (
                            <Link
                              to={`/admin/candidates/${c._id}`}
                              className="link link-hover font-medium"
                            >
                              {c.name || "Unknown"}
                            </Link>
                          ) : (
                            <div className="font-medium">{c.name || "Unknown"}</div>
                          )}
                          <div className="text-sm opacity-70">{c.email}</div>
                        </td>
                        <td>
                          {c.yearsOfExperience ?? "-"}
                          {c.yearsOfExperience != null ? " yrs" : ""}
                        </td>
                        <td>
                          {c.expectedSalary != null
                            ? Number(c.expectedSalary).toLocaleString()
                            : "-"}
                        </td>
                        <td>
                          <div className="flex flex-col gap-1">
                            {c.githubUrl ? (
                              <a
                                className="link"
                                href={toUrl(c.githubUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                GitHub
                              </a>
                            ) : (
                              <span className="opacity-50">No GitHub</span>
                            )}
                            {c.projectUrl ? (
                              <a
                                className="link"
                                href={toUrl(c.projectUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Project
                              </a>
                            ) : (
                              <span className="opacity-50">No project</span>
                            )}
                          </div>
                        </td>
                        <td>{new Date(app.appliedAt).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${STATUS_BADGES[app.status]}`}>
                            {STATUS_LABELS[app.status] || app.status}
                          </span>
                        </td>
                        <td>
                          <select
                            className="select select-sm"
                            aria-label={`Change status for ${c.name || "candidate"}`}
                            value=""
                            disabled={updatingId === app._id}
                            onChange={(e) =>
                              handleStatusChange(app._id, e.target.value)
                            }
                          >
                            <option value="">
                              {updatingId === app._id ? "Updating..." : "Change..."}
                            </option>
                            {MANUAL_STATUSES.filter((s) => s !== app.status).map(
                              (s) => (
                                <option key={s} value={s}>
                                  {STATUS_LABELS[s]}
                                </option>
                              )
                            )}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminTrackingPage;
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../lib/axios.js";
import useAuth from "../hooks/UseAuth.js";
import NavBar from "../components/NavBar.jsx";
import Loader from "../components/Loader.jsx";

const STATUS_LABELS = {
  applied: "Applied",
  shortlisted: "Shortlisted",
  test_assigned: "Test Assigned",
  test_completed: "Test Completed",
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

const MANUAL_STATUSES = ["applied", "shortlisted", "selected", "rejected"];

const toUrl = (value) =>
  /^https?:\/\//i.test(value) ? value : `https://${value}`;

function AdminTrackingPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

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

  // Test assignment modal state
  const [testModalApp, setTestModalApp] = useState(null);
  const [testDifficulty, setTestDifficulty] = useState("medium");
  const [testDuration, setTestDuration] = useState(60);
  const [assigningTest, setAssigningTest] = useState(false);

  const myId = user?._id || user?.id;

  useEffect(() => {
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
      } finally {
        setLoadingJobs(false);
      }
    };

    loadJobs();
  }, [myId]);

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
          setError(err.response?.data?.message || "Failed to load applicants");
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
    setTimeout(() => setNotice(""), 3500);
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

  const handleOpenAssignModal = (app) => {
    const selectedJob = jobs.find((j) => j._id === selectedJobId);
    setTestModalApp(app);
    setTestDifficulty(selectedJob?.difficultyLevel || "medium");
    setTestDuration(60);
  };

  const handleAssignTest = async () => {
    if (!testModalApp) return;
    setAssigningTest(true);
    setError("");

    try {
      const res = await api.post(`/api/tests/assign/${testModalApp._id}`, {
        difficultyLevel: testDifficulty,
        duration: Number(testDuration)
      });

      setApplications((prev) =>
        prev.map((app) =>
          app._id === testModalApp._id
            ? { ...app, status: "test_assigned", testInstance: res.data.testInstance }
            : app
        )
      );

      showNotice(`Coding test assigned to ${testModalApp.candidate?.name || "candidate"}!`);
      setTestModalApp(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign test");
    } finally {
      setAssigningTest(false);
    }
  };

  const visibleApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((app) => {
      if (statusFilter !== "all" && app.status !== statusFilter) return false;
      if (!query) return true;

      const c = app.candidate || {};
      return `${c.name || ""} ${c.email || ""} ${c.jobRole || ""}`.toLowerCase().includes(query);
    });
  }, [applications, statusFilter, search]);

  if (loadingJobs) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col">
        <NavBar />
        <Loader message="Loading recruiter dashboard..." />
      </div>
    );
  }

  const selectedJob = jobs.find((j) => j._id === selectedJobId);

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      <NavBar />

      <div className="max-w-screen-2xl mx-auto w-full p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Applicant Tracking</h1>
            <p className="text-sm opacity-70 mt-1">
              Review candidates, assign coding assessments, and inspect test results.
            </p>
          </div>
          <Link to="/admin/jobs/new" className="btn btn-primary btn-sm">
            + Post Another Job
          </Link>
        </div>

        {error && (
          <div role="alert" className="alert alert-error mb-4 shadow-sm">
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div role="status" className="alert alert-success mb-4 shadow-sm">
            <span>{notice}</span>
          </div>
        )}

        {jobs.length === 0 ? (
          <div className="card bg-base-100 border border-base-300 p-12 text-center shadow-xs">
            <h2 className="text-xl font-bold">No Active Job Postings</h2>
            <p className="text-sm opacity-70 mt-2 mb-6">
              You haven't posted any jobs yet. Create a job posting to start receiving applicants.
            </p>
            <div>
              <Link to="/admin/jobs/new" className="btn btn-primary">
                Create First Job Post
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Filters & Job Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 bg-base-100 p-4 rounded-xl border border-base-300 shadow-xs">
              <div>
                <label className="text-xs font-semibold opacity-70 mb-1 block">Selected Job</label>
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
              </div>

              <div>
                <label className="text-xs font-semibold opacity-70 mb-1 block">Filter Status</label>
                <select
                  className="select w-full"
                  aria-label="Filter by status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses ({applications.length})</option>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold opacity-70 mb-1 block">Search Candidates</label>
                <input
                  className="input w-full"
                  type="search"
                  placeholder="Search by name, email, or role..."
                  aria-label="Search applicants"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mb-3 text-xs opacity-75 font-medium px-1">
              <span>
                {loadingApps
                  ? "Loading applicant list..."
                  : `Showing ${visibleApplications.length} of ${applications.length} applicants for "${selectedJob?.title || ""}"`}
              </span>
              {selectedJob && (
                <span>Difficulty Preset: <strong className="uppercase">{selectedJob.difficultyLevel}</strong></span>
              )}
            </div>

            {loadingApps && <Loader message="Fetching candidates..." />}

            {!loadingApps && applications.length === 0 && !error && (
              <div className="card bg-base-100 border border-base-300 p-12 text-center shadow-xs">
                <p className="text-lg font-bold">No Applications Yet</p>
                <p className="text-sm opacity-70 mt-1">
                  Candidates who apply to this role will appear here automatically.
                </p>
              </div>
            )}

            {!loadingApps && applications.length > 0 && (
              <div className="overflow-x-auto bg-base-100 border border-base-300 rounded-xl shadow-xs">
                <table className="table">
                  <thead>
                    <tr className="bg-base-200/50">
                      <th>Candidate</th>
                      <th>Experience</th>
                      <th>Expected Salary</th>
                      <th>Portfolio & Resume</th>
                      <th>Applied Date</th>
                      <th>Current Stage</th>
                      <th>Assessment & Report</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleApplications.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-8 opacity-70">
                          No applicants match your search and filter criteria.
                        </td>
                      </tr>
                    )}

                    {visibleApplications.map((app) => {
                      const c = app.candidate || {};
                      const test = app.testInstance;

                      return (
                        <tr key={app._id} className="hover:bg-base-200/40 transition-colors">
                          <td>
                            {c._id ? (
                              <Link
                                to={`/admin/candidates/${c._id}`}
                                className="link link-primary font-bold block hover:underline"
                                title="View candidate profile"
                              >
                                {c.name || "Unknown Candidate"}
                              </Link>
                            ) : (
                              <span className="font-bold">{c.name || "Unknown"}</span>
                            )}
                            <span className="text-xs opacity-70 block">{c.email}</span>
                            {c.jobRole && (
                              <span className="text-[11px] text-primary/80 block mt-0.5">{c.jobRole}</span>
                            )}
                          </td>

                          <td>
                            <span className="font-medium">
                              {c.yearsOfExperience != null ? `${c.yearsOfExperience} yrs` : "-"}
                            </span>
                          </td>

                          <td>
                            <span className="font-medium">
                              {c.expectedSalary != null
                                ? `$${Number(c.expectedSalary).toLocaleString()}`
                                : "-"}
                            </span>
                          </td>

                          <td>
                            <div className="flex flex-col gap-1 text-xs">
                              {c.resumeUrl && (
                                <a
                                  href={c.resumeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="link link-primary font-semibold"
                                >
                                  📄 Resume
                                </a>
                              )}
                              {c.githubUrl && (
                                <a
                                  href={toUrl(c.githubUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="link opacity-80"
                                >
                                  🐙 GitHub
                                </a>
                              )}
                              {c.projectUrl && (
                                <a
                                  href={toUrl(c.projectUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="link opacity-80"
                                >
                                  🌐 Project
                                </a>
                              )}
                              {!c.resumeUrl && !c.githubUrl && !c.projectUrl && (
                                <span className="opacity-40">-</span>
                              )}
                            </div>
                          </td>

                          <td>
                            <span className="text-xs">
                              {new Date(app.appliedAt).toLocaleDateString()}
                            </span>
                          </td>

                          <td>
                            <span className={`badge ${STATUS_BADGES[app.status] || "badge-ghost"} font-semibold text-xs`}>
                              {STATUS_LABELS[app.status] || app.status}
                            </span>
                          </td>

                          {/* Assessment Column */}
                          <td>
                            {app.status === "applied" || app.status === "shortlisted" ? (
                              <button
                                type="button"
                                onClick={() => handleOpenAssignModal(app)}
                                className="btn btn-outline btn-primary btn-xs"
                              >
                                🎯 Assign Test
                              </button>
                            ) : app.status === "test_assigned" ? (
                              <span className="text-xs text-warning font-semibold">
                                In Progress ⏳
                              </span>
                            ) : (
                              <Link
                                to={`/admin/reports/${app._id}`}
                                className="btn btn-secondary btn-xs font-semibold shadow-xs"
                              >
                                📊 View Report
                              </Link>
                            )}
                          </td>

                          {/* Quick Status Dropdown */}
                          <td>
                            <select
                              className="select select-xs"
                              aria-label={`Change status for ${c.name || "candidate"}`}
                              value={app.status}
                              disabled={updatingId === app._id}
                              onChange={(e) => handleStatusChange(app._id, e.target.value)}
                            >
                              {MANUAL_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {STATUS_LABELS[s]}
                                </option>
                              ))}
                              {app.status === "test_assigned" && (
                                <option value="test_assigned" disabled>Test Assigned</option>
                              )}
                              {app.status === "test_completed" && (
                                <option value="test_completed" disabled>Test Completed</option>
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

        {/* Assign Test Modal */}
        {testModalApp && (
          <dialog className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg">
                Assign Coding Test to {testModalApp.candidate?.name}
              </h3>
              <p className="py-2 text-xs opacity-75">
                The candidate will receive an immediate notification with a link to take their timed DSA test.
              </p>

              <div className="space-y-4 my-4">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend font-semibold">Difficulty Level</legend>
                  <select
                    className="select w-full"
                    value={testDifficulty}
                    onChange={(e) => setTestDifficulty(e.target.value)}
                  >
                    <option value="easy">Easy (7 Easy, 2 Medium, 1 Hard)</option>
                    <option value="medium">Medium (3 Easy, 5 Medium, 2 Hard)</option>
                    <option value="hard">Hard (2 Easy, 3 Medium, 5 Hard)</option>
                  </select>
                </fieldset>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend font-semibold">Time Limit (Minutes)</legend>
                  <input
                    type="number"
                    className="input w-full"
                    min="15"
                    max="180"
                    step="5"
                    value={testDuration}
                    onChange={(e) => setTestDuration(e.target.value)}
                  />
                  <span className="label text-xs opacity-70">
                    Countdown timer will start when the candidate opens the test.
                  </span>
                </fieldset>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setTestModalApp(null)}
                  disabled={assigningTest}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAssignTest}
                  disabled={assigningTest}
                >
                  {assigningTest ? "Assigning..." : "Confirm & Send Test"}
                </button>
              </div>
            </div>
          </dialog>
        )}
      </div>
    </div>
  );
}

export default AdminTrackingPage;
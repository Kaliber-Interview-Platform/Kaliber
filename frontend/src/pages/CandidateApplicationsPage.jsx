import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/axios.js";
import useAuth from "../hooks/UseAuth.js";
import NavBar from "../components/NavBar.jsx";
import Loader from "../components/Loader.jsx";

const STATUS_CONFIG = {
  applied: { label: "Applied", badge: "badge-info", desc: "Your application is under initial review." },
  shortlisted: { label: "Shortlisted", badge: "badge-primary", desc: "You have been shortlisted! An interview test will be assigned soon." },
  test_assigned: { label: "Test Assigned", badge: "badge-warning", desc: "You have an active coding test ready to take!" },
  test_completed: { label: "Test Completed", badge: "badge-secondary", desc: "Your test has been graded and is awaiting recruiter review." },
  selected: { label: "Selected", badge: "badge-success", desc: "Congratulations! You have been selected for this position." },
  rejected: { label: "Not Selected", badge: "badge-error", desc: "Thank you for applying. You were not selected for this position." }
};

export default function CandidateApplicationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadApplications = async () => {
    try {
      const res = await api.get("/api/applications/mine");
      setApplications(res.data.applications || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      <NavBar />

      <div className="max-w-5xl mx-auto w-full p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">My Applications</h1>
            <p className="text-sm opacity-70 mt-1">
              Track your hiring stages, test assignments, and interview results.
            </p>
          </div>
          <Link to="/" className="btn btn-outline btn-sm">
            Browse More Jobs
          </Link>
        </div>

        {error && (
          <div role="alert" className="alert alert-error mb-6 shadow-sm">
            <span>{error}</span>
          </div>
        )}

        {loading && <Loader message="Loading your applications..." />}

        {!loading && !error && applications.length === 0 && (
          <div className="card bg-base-100 border border-base-300 p-12 text-center shadow-xs">
            <div className="max-w-md mx-auto">
              <div className="text-4xl mb-3">📄</div>
              <h2 className="text-xl font-bold">No Applications Yet</h2>
              <p className="text-sm opacity-70 mt-2 mb-6">
                You haven't submitted any job applications yet. Browse the job board to find open positions.
              </p>
              <Link to="/" className="btn btn-primary">
                Explore Jobs
              </Link>
            </div>
          </div>
        )}

        {!loading && applications.length > 0 && (
          <div className="space-y-4">
            {applications.map((app) => {
              const job = app.jobPost || {};
              const statusCfg = STATUS_CONFIG[app.status] || {
                label: app.status,
                badge: "badge-ghost",
                desc: ""
              };
              const test = app.testInstance;
              const testInstanceId = typeof test === "object" ? test?._id : test;

              return (
                <div
                  key={app._id}
                  className="card bg-base-100 border border-base-300 shadow-xs hover:shadow-md transition-shadow"
                >
                  <div className="card-body p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl font-bold">{job.title || "Untitled Role"}</h2>
                          <span className={`badge font-semibold ${statusCfg.badge}`}>
                            {statusCfg.label}
                          </span>
                        </div>
                        <p className="text-sm opacity-75 font-medium mt-1">
                          {job.company} • {job.location}
                        </p>
                        <p className="text-xs opacity-60 mt-1">
                          Applied on {new Date(app.appliedAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Action column */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        {app.status === "test_assigned" && testInstanceId && (
                          <button
                            type="button"
                            onClick={() => navigate(`/test/${testInstanceId}`)}
                            className="btn btn-primary btn-sm shadow-md animate-bounce"
                          >
                            🚀 Take Coding Test
                          </button>
                        )}

                        {app.status === "test_completed" && test && (
                          <div className="text-xs font-semibold bg-base-200 px-3 py-2 rounded-lg border border-base-300">
                            Score: {test.score != null ? test.score : "Under Review"}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-base-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <span className="opacity-75">{statusCfg.desc}</span>
                      <div className="flex gap-4 opacity-60 font-mono">
                        {job.difficultyLevel && (
                          <span>Difficulty: {job.difficultyLevel.toUpperCase()}</span>
                        )}
                        {job.salary && (
                          <span>${Number(job.salary).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

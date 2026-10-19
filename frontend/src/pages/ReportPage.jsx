import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../lib/axios.js";
import NavBar from "../components/NavBar.jsx";
import Loader from "../components/Loader.jsx";
import { formatDuration } from "../lib/utils.js";

export default function ReportPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const fetchReport = async () => {
    try {
      const res = await api.get(`/api/reports/${applicationId}`);
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load evaluation report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [applicationId]);

  const handleUpdateStatus = async (newStatus) => {
    setUpdatingStatus(true);
    setStatusMessage("");
    setError("");

    try {
      await api.patch(`/api/applications/${applicationId}/status`, {
        status: newStatus
      });

      setReport((prev) => ({
        ...prev,
        applicationStatus: newStatus
      }));

      setStatusMessage(
        `Candidate successfully marked as "${newStatus === "selected" ? "Selected (Offer)" : "Rejected"}".`
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col">
        <NavBar />
        <Loader message="Compiling candidate assessment report..." />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col">
        <NavBar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="card bg-base-100 border border-base-300 max-w-md p-6 text-center">
            <h2 className="text-xl font-bold text-error">Unable to Open Report</h2>
            <p className="text-sm opacity-75 mt-2 mb-4">{error || "Report not found."}</p>
            <Link to="/admin/applications" className="btn btn-outline btn-sm">
              Back to Applications
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const {
    candidate,
    jobPost,
    applicationStatus,
    score,
    totalQuestions,
    totalTimeSeconds,
    breakdown,
    questions
  } = report;

  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      <NavBar />

      <div className="max-w-5xl mx-auto w-full p-4 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(-1)}
          >
            ← Back to Applications
          </button>
          <span className="badge badge-outline">Candidate Assessment Report</span>
        </div>

        {statusMessage && (
          <div role="status" className="alert alert-success mb-6 shadow-sm">
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Candidate & Assessment Overview Card */}
        <div className="card bg-base-100 border border-base-300 shadow-sm mb-6">
          <div className="card-body p-6 sm:p-8 gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-base-200 pb-6">
              <div>
                <h1 className="text-3xl font-extrabold">{candidate?.name || "Candidate"}</h1>
                <p className="text-sm opacity-75 mt-0.5">
                  Applied for <strong className="text-primary">{jobPost?.title}</strong> ({jobPost?.company})
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="opacity-70">{candidate?.email}</span>
                  {candidate?.yearsOfExperience != null && (
                    <span>• {candidate.yearsOfExperience} yrs exp</span>
                  )}
                  {candidate?._id && (
                    <Link
                      to={`/admin/candidates/${candidate._id}`}
                      className="link link-primary font-semibold"
                    >
                      View Full Profile →
                    </Link>
                  )}
                </div>
              </div>

              {/* Status & Decision Buttons */}
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs opacity-70">Current Stage:</span>
                  <span className="badge badge-primary font-bold uppercase text-xs">
                    {applicationStatus}
                  </span>
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("selected")}
                    disabled={updatingStatus || applicationStatus === "selected"}
                    className="btn btn-success btn-sm font-semibold shadow-xs"
                  >
                    ✓ Select Candidate
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("rejected")}
                    disabled={updatingStatus || applicationStatus === "rejected"}
                    className="btn btn-error btn-outline btn-sm font-semibold"
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            </div>

            {/* Assessment Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="bg-base-200 p-4 rounded-xl border border-base-300">
                <span className="text-xs uppercase font-bold tracking-wider opacity-70 block mb-1">
                  Overall Score
                </span>
                <span className="text-3xl font-black text-primary">
                  {score} / {totalQuestions}
                </span>
                <span className="text-xs opacity-60 block mt-1">({percentage}% Correct)</span>
              </div>

              <div className="bg-base-200 p-4 rounded-xl border border-base-300">
                <span className="text-xs uppercase font-bold tracking-wider opacity-70 block mb-1">
                  Time Taken
                </span>
                <span className="text-3xl font-black text-secondary">
                  {totalTimeSeconds != null ? formatDuration(totalTimeSeconds) : "--:--"}
                </span>
                <span className="text-xs opacity-60 block mt-1">
                  {totalTimeSeconds != null ? `${Math.round(totalTimeSeconds / 60)} minutes` : "Not recorded"}
                </span>
              </div>

              <div className="bg-base-200 p-4 rounded-xl border border-base-300">
                <span className="text-xs uppercase font-bold tracking-wider opacity-70 block mb-1">
                  Easy Passed
                </span>
                <span className="text-2xl font-bold text-success">
                  {breakdown?.easy?.passed ?? 0} / {breakdown?.easy?.total ?? 0}
                </span>
              </div>

              <div className="bg-base-200 p-4 rounded-xl border border-base-300">
                <span className="text-xs uppercase font-bold tracking-wider opacity-70 block mb-1">
                  Med / Hard Passed
                </span>
                <span className="text-2xl font-bold text-warning">
                  {(breakdown?.medium?.passed ?? 0) + (breakdown?.hard?.passed ?? 0)} /{" "}
                  {(breakdown?.medium?.total ?? 0) + (breakdown?.hard?.total ?? 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Per-Question Code Submissions */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Question Submissions ({questions?.length || 0})</h2>

          {questions && questions.length > 0 ? (
            questions.map((entry, idx) => {
              const q = entry.question || {};
              const isPassed = entry.passed;

              return (
                <div
                  key={idx}
                  className={`card bg-base-100 border ${
                    isPassed ? "border-success/40" : "border-base-300"
                  } shadow-xs overflow-hidden`}
                >
                  <div className="card-body p-6">
                    <div className="flex items-center justify-between border-b border-base-200 pb-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-neutral font-mono font-bold">
                          #{idx + 1}
                        </span>
                        <h3 className="font-bold text-base">{q.title || "Question"}</h3>
                        {q.difficulty && (
                          <span className="badge badge-ghost uppercase text-xs">
                            {q.difficulty}
                          </span>
                        )}
                      </div>

                      <span
                        className={`badge font-bold ${
                          isPassed ? "badge-success" : "badge-error"
                        }`}
                      >
                        {isPassed ? "Passed ✓" : "Failed / Unattempted ✗"}
                      </span>
                    </div>

                    {entry.code ? (
                      <div className="bg-neutral-900 text-neutral-100 p-4 rounded-xl overflow-x-auto font-mono text-xs leading-relaxed max-h-96">
                        <pre><code>{entry.code}</code></pre>
                      </div>
                    ) : (
                      <p className="text-xs opacity-50 italic py-2">
                        No code submitted for this question.
                      </p>
                    )}

                    {entry.submittedAt && (
                      <span className="text-[11px] opacity-60 mt-2 block">
                        Submitted at: {new Date(entry.submittedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm opacity-60">No question data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

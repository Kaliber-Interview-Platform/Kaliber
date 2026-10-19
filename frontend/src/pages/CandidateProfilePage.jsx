import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/axios.js";
import NavBar from "../components/NavBar.jsx";
import Loader from "../components/Loader.jsx";

export default function CandidateProfilePage() {
  const { candidateId } = useParams();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const res = await api.get(`/api/users/candidates/${candidateId}`);
        setCandidate(res.data.candidate);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load candidate profile");
      } finally {
        setLoading(false);
      }
    };

    fetchCandidate();
  }, [candidateId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col">
        <NavBar />
        <Loader message="Loading candidate profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      <NavBar />

      <div className="max-w-4xl mx-auto w-full p-4 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(-1)}
          >
            ← Back to Applications
          </button>
          <span className="badge badge-outline">Candidate Profile</span>
        </div>

        {error && (
          <div role="alert" className="alert alert-error mb-6 shadow-sm">
            <span>{error}</span>
          </div>
        )}

        {candidate && (
          <div className="card bg-base-100 border border-base-300 shadow-sm">
            <div className="card-body p-6 sm:p-8 gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 border-b border-base-200 pb-6">
                <div className="w-20 h-20 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-3xl shadow-sm">
                  {(candidate.name || "C")[0].toUpperCase()}
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold">{candidate.name}</h1>
                  <p className="text-base opacity-75 mt-0.5">{candidate.email}</p>
                  {candidate.jobRole && (
                    <p className="text-sm font-medium text-primary mt-1">
                      {candidate.jobRole}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-base-200 p-4 rounded-xl border border-base-300">
                  <span className="text-xs opacity-70 block font-semibold">Experience</span>
                  <span className="text-lg font-bold">
                    {candidate.yearsOfExperience != null ? `${candidate.yearsOfExperience} years` : "Not specified"}
                  </span>
                </div>

                <div className="bg-base-200 p-4 rounded-xl border border-base-300">
                  <span className="text-xs opacity-70 block font-semibold">Expected Salary</span>
                  <span className="text-lg font-bold">
                    {candidate.expectedSalary != null
                      ? `$${Number(candidate.expectedSalary).toLocaleString()}`
                      : "Not specified"}
                  </span>
                </div>

                <div className="bg-base-200 p-4 rounded-xl border border-base-300 col-span-2 sm:col-span-1">
                  <span className="text-xs opacity-70 block font-semibold">Candidate ID</span>
                  <span className="text-xs font-mono opacity-80 truncate block mt-1">
                    {candidate._id}
                  </span>
                </div>
              </div>

              {/* External Links */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold uppercase tracking-wider opacity-70">
                  Portfolio & Links
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {candidate.resumeUrl ? (
                    <a
                      href={candidate.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-primary btn-sm justify-start gap-2"
                    >
                      📄 View Resume
                    </a>
                  ) : (
                    <div className="btn btn-outline btn-disabled btn-sm justify-start opacity-50">
                      📄 No Resume Linked
                    </div>
                  )}

                  {candidate.githubUrl ? (
                    <a
                      href={candidate.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm justify-start gap-2"
                    >
                      🐙 GitHub Profile
                    </a>
                  ) : (
                    <div className="btn btn-outline btn-disabled btn-sm justify-start opacity-50">
                      🐙 No GitHub Linked
                    </div>
                  )}

                  {candidate.projectUrl ? (
                    <a
                      href={candidate.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm justify-start gap-2"
                    >
                      🌐 Featured Project
                    </a>
                  ) : (
                    <div className="btn btn-outline btn-disabled btn-sm justify-start opacity-50">
                      🌐 No Project Linked
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

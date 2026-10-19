import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios.js";
import useAuth from "../hooks/UseAuth.js";
import NavBar from "../components/NavBar.jsx";
import Loader from "../components/Loader.jsx";

const emptyProfile = {
  name: "",
  email: "",
  password: "",
  yearsOfExperience: "",
  jobRole: "",
  githubUrl: "",
  projectUrl: "",
  expectedSalary: "",
  resumeUrl: ""
};

function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser, logout, isAdmin, isCandidate } = useAuth();

  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/api/users/profile");
        const u = res.data.user;

        setProfile({
          name: u.name || "",
          email: u.email || "",
          password: "",
          yearsOfExperience: u.yearsOfExperience ?? "",
          jobRole: u.jobRole || "",
          githubUrl: u.githubUrl || "",
          projectUrl: u.projectUrl || "",
          expectedSalary: u.expectedSalary ?? "",
          resumeUrl: u.resumeUrl || ""
        });

        updateUser(u);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setError("");

    try {
      await api.delete("/api/users/profile");
      await logout();
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete account");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        name: profile.name.trim(),
        email: profile.email.trim(),
        yearsOfExperience:
          profile.yearsOfExperience === ""
            ? null
            : Number(profile.yearsOfExperience),
        jobRole: profile.jobRole.trim(),
        githubUrl: profile.githubUrl.trim(),
        projectUrl: profile.projectUrl.trim(),
        expectedSalary:
          profile.expectedSalary === ""
            ? null
            : Number(profile.expectedSalary),
        resumeUrl: profile.resumeUrl.trim()
      };

      if (profile.password) {
        payload.password = profile.password;
      }

      const res = await api.put("/api/users/profile", payload);
      const updatedUser = res.data.user;

      setProfile((prev) => ({
        ...prev,
        ...updatedUser,
        password: "",
        yearsOfExperience: updatedUser.yearsOfExperience ?? "",
        expectedSalary: updatedUser.expectedSalary ?? ""
      }));

      updateUser(updatedUser);
      setMessage("Profile updated successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col">
        <NavBar />
        <Loader message="Loading your profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      <NavBar />

      <div className="max-w-4xl mx-auto w-full p-4 sm:p-8">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-base-100 p-6 rounded-2xl border border-base-300 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-2xl shadow-sm">
              {(profile.name || "U")[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{profile.name || "My Profile"}</h1>
              <p className="text-sm opacity-70">{profile.email}</p>
              <span className="badge badge-primary badge-sm font-semibold capitalize mt-1">
                {user?.role === "admin" ? "Recruiter (Admin)" : "Candidate"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => navigate("/admin/jobs/new")}
                  className="btn btn-primary btn-sm flex-1 sm:flex-none"
                >
                  + Post Job
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/admin/applications")}
                  className="btn btn-outline btn-sm flex-1 sm:flex-none"
                >
                  Applications
                </button>
              </>
            )}

            {isCandidate && (
              <button
                type="button"
                onClick={() => navigate("/applications/mine")}
                className="btn btn-primary btn-sm flex-1 sm:flex-none"
              >
                My Applications
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="btn btn-outline btn-sm"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>

        {message && (
          <div role="status" className="alert alert-success mb-6 shadow-sm">
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div role="alert" className="alert alert-error mb-6 shadow-sm">
            <span>{error}</span>
          </div>
        )}

        {/* Profile Edit Form */}
        <form onSubmit={handleSubmit} className="card bg-base-100 border border-base-300 shadow-sm">
          <div className="card-body gap-5 p-6 sm:p-8">
            <h2 className="card-title text-lg border-b border-base-200 pb-3">
              Profile Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend font-semibold">Full Name *</legend>
                <input
                  type="text"
                  name="name"
                  className="input w-full"
                  value={profile.name}
                  onChange={handleChange}
                  required
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend font-semibold">Email Address *</legend>
                <input
                  type="email"
                  name="email"
                  className="input w-full"
                  value={profile.email}
                  onChange={handleChange}
                  required
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend font-semibold">Change Password</legend>
                <input
                  type="password"
                  name="password"
                  className="input w-full"
                  placeholder="Leave blank to keep current"
                  value={profile.password}
                  onChange={handleChange}
                  minLength={6}
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend font-semibold">Job Role / Headline</legend>
                <input
                  type="text"
                  name="jobRole"
                  className="input w-full"
                  placeholder="e.g. Full Stack Developer, SDE-1"
                  value={profile.jobRole}
                  onChange={handleChange}
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend font-semibold">Years of Experience</legend>
                <input
                  type="number"
                  name="yearsOfExperience"
                  className="input w-full"
                  placeholder="0"
                  min="0"
                  step="any"
                  value={profile.yearsOfExperience}
                  onChange={handleChange}
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend font-semibold">Expected Annual Salary ($)</legend>
                <input
                  type="number"
                  name="expectedSalary"
                  className="input w-full"
                  placeholder="e.g. 85000"
                  min="0"
                  step="1"
                  value={profile.expectedSalary}
                  onChange={handleChange}
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend font-semibold">GitHub Profile URL</legend>
                <input
                  type="url"
                  name="githubUrl"
                  className="input w-full"
                  placeholder="https://github.com/username"
                  value={profile.githubUrl}
                  onChange={handleChange}
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend font-semibold">Portfolio / Project URL</legend>
                <input
                  type="url"
                  name="projectUrl"
                  className="input w-full"
                  placeholder="https://portfolio.dev"
                  value={profile.projectUrl}
                  onChange={handleChange}
                />
              </fieldset>

              <fieldset className="fieldset md:col-span-2">
                <legend className="fieldset-legend font-semibold">Resume Link / Document URL</legend>
                <input
                  type="url"
                  name="resumeUrl"
                  className="input w-full"
                  placeholder="https://drive.google.com/... or link to resume PDF"
                  value={profile.resumeUrl}
                  onChange={handleChange}
                />
                <span className="label text-xs opacity-70">
                  Provide a shareable URL to your resume for recruiters to review.
                </span>
              </fieldset>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-base-200">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-ghost btn-outline btn-error btn-sm"
              >
                Delete Account
              </button>
            </div>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <dialog className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg text-error">Delete Account Permanently?</h3>
              <p className="py-4 text-sm opacity-85">
                This will permanently delete your account, personal data, and all
                associated {isAdmin ? "job posts and applicant records" : "job applications and test results"}.
                This action is irreversible.
              </p>
              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-error"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </div>
          </dialog>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
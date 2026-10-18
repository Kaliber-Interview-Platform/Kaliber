import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios.js";

const emptyProfile = {
  name: "",
  email: "",
  yearsOfExperience: "",
  jobRole: "",
  githubUrl: "",
  projectUrl: "",
  expectedSalary: "",
  resumeUrl: ""
};

function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(emptyProfile);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deleting,setDeleting] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await api.get("/api/users/profile");
        const user = res.data.user;

        setProfile({
          name: user.name || "",
          email: user.email || "",
          yearsOfExperience: user.yearsOfExperience ?? "",
          jobRole: user.jobRole || "",
          githubUrl: user.githubUrl || "",
          projectUrl: user.projectUrl || "",
          expectedSalary: user.expectedSalary ?? "",
          resumeUrl: user.resumeUrl || ""
        });

        setRole(user.role || "");
        localStorage.setItem("user", JSON.stringify(user));
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load profile"
        );

        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      // Tells the backend to blacklist the current token
      await api.post("/api/users/logout");
    } catch (err) {
        // Even if the request fails, still log the user out on the client
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  const handleDeleteAccount = async () => {
  const confirmed = window.confirm(
    "Delete your account permanently? This can't be undone."
  );
  if (!confirmed) return;

  setDeleting(true);
  setError("");

  try {
    await api.delete("/api/users/profile");   // change this URL to match your delete route
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  } catch (err) {
    setError(err.response?.data?.message || "Failed to delete account");
    setDeleting(false);
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        ...profile,
        yearsOfExperience:
          profile.yearsOfExperience === ""
            ? null
            : Number(profile.yearsOfExperience),
        expectedSalary:
          profile.expectedSalary === ""
            ? null
            : Number(profile.expectedSalary)
      };

      const res = await api.put("/api/users/profile", payload);
      const updatedUser = res.data.user;

      setProfile({
        ...emptyProfile,
        ...updatedUser,
        yearsOfExperience: updatedUser.yearsOfExperience ?? "",
        expectedSalary: updatedUser.expectedSalary ?? ""
      });

      setRole(updatedUser.role);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-8">Loading profile...</p>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-2">
        <button
        type="button"
        onClick={() => navigate("/")}
        className="btn btn-primary btn-sm">
        Back</button>
  <h1 className="text-3xl font-bold">My Profile</h1>

  <div className="flex gap-2">
    {role === "admin" && (
      <button
        type="button"
        onClick={() => navigate("/admin/jobs/new")}
        className="btn btn-primary btn-sm"
      >
        Create job post
      </button>
    )}

    {role === "admin" && (
    <button
      type="button"
      onClick={() => navigate("/admin/applications")}
      className="btn btn-primary btn-sm"
    >
    Applications
    </button>
)}

    <button
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
      className="btn btn-outline btn-error btn-sm"
    >
      {loggingOut ? "Logging out..." : "Logout"}
    </button>

    <button
      type="button"
      onClick={handleDeleteAccount}
      disabled={deleting || loggingOut}
      className="btn btn-error btn-sm"
    >
      {deleting ? "Deleting..." : "Delete account"}
    </button>
  </div>
</div>
      <p className="mb-6">Account type: {role}</p>

      {message && (
        <div role="status" className="alert alert-success mb-4">
          {message}
        </div>
      )}

      {error && (
        <div role="alert" className="alert alert-error mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card bg-base-100 border border-base-300">
        <div className="card-body gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ["name", "Full name"],
            ["email", "Email"],
            ["yearsOfExperience", "Years of experience"],
            ["jobRole", "Job role"],
            ["githubUrl", "GitHub URL"],
            ["projectUrl", "Project URL"],
            ["expectedSalary", "Expected salary"],
            ["resumeUrl", "Resume URL"]
          ].map(([name, label]) => (
            <fieldset className="fieldset" key={name}>
              <legend className="fieldset-legend">{label}</legend>

              <input
                className="input w-full"
                type={
                  name === "email"
                    ? "email"
                    : name === "yearsOfExperience" ||
                      name === "expectedSalary"
                    ? "number"
                    : "text"
                }
                name={name}
                value={profile[name]}
                onChange={handleChange}
                min={
                  name === "yearsOfExperience" ||
                  name === "expectedSalary"
                    ? "0"
                    : undefined
                }
                step={
                  name === "yearsOfExperience" ? "any" : "1"
                }
                required={name === "name" || name === "email"}
              />
            </fieldset>
          ))}

          <button
            type="submit"
            className=" btn btn-primary"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default ProfilePage;
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../lib/axios.js";
import useAuth from "../hooks/UseAuth.js";
import NavBar from "../components/NavBar.jsx";
import Loader from "../components/Loader.jsx";

const EMPLOYMENT_TYPES = [
  { value: "job", label: "Full-Time Job" },
  { value: "internship", label: "Internship" }
];

const DIFFICULTY_LEVELS = [
  { value: "easy", label: "Easy (Foundational DSA)" },
  { value: "medium", label: "Medium (Standard LeetCode Medium)" },
  { value: "hard", label: "Hard (Advanced Algorithms)" }
];

const emptyJob = {
  title: "",
  company: "",
  location: "",
  description: "",
  typeOfEmployment: "job",
  requiredSkills: "",
  yearsOfExperience: "",
  salary: "",
  difficultyLevel: "medium",
  openings: "1",
  deadline: "",
  status: "open"
};

function JobPostFormPage() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const isEdit = Boolean(jobId);
  const { user } = useAuth();

  const [job, setJob] = useState(emptyJob);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) return;

    const fetchJob = async () => {
      try {
        const res = await api.get(`/api/jobs/${jobId}`);
        const data = res.data.jobPost;

        setJob({
          title: data.title || "",
          company: data.company || "",
          location: data.location || "",
          description: data.description || "",
          typeOfEmployment: data.typeOfEmployment || "job",
          requiredSkills: (data.requiredSkills || []).join(", "),
          yearsOfExperience: data.yearsOfExperience ?? "",
          salary: data.salary ?? "",
          difficultyLevel: data.difficultyLevel || "medium",
          openings: data.openings ?? "1",
          deadline: data.deadline ? data.deadline.slice(0, 10) : "",
          status: data.status || "open"
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load job post");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [isEdit, jobId]);

  const handleChange = (e) => {
    setJob({
      ...job,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const skills = job.requiredSkills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (skills.length === 0) {
      setError("Please add at least one required skill (separated by commas).");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: job.title.trim(),
        company: job.company.trim(),
        location: job.location.trim(),
        description: job.description.trim(),
        typeOfEmployment: job.typeOfEmployment,
        requiredSkills: skills,
        yearsOfExperience:
          job.yearsOfExperience === "" ? 0 : Number(job.yearsOfExperience),
        salary: Number(job.salary),
        difficultyLevel: job.difficultyLevel,
        openings: job.openings === "" ? 1 : Number(job.openings),
        deadline: job.deadline || null,
        status: job.status
      };

      if (isEdit) {
        await api.put(`/api/jobs/${jobId}`, payload);
        setMessage("Job post updated successfully!");
      } else {
        await api.post("/api/jobs", payload);
        setMessage("Job post published successfully!");
      }

      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save job post");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col">
        <NavBar />
        <Loader message="Loading job posting details..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      <NavBar />

      <div className="max-w-4xl mx-auto w-full p-4 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {isEdit ? "Edit Job Posting" : "Create New Job Posting"}
            </h1>
            <p className="text-sm opacity-70 mt-1">
              {isEdit
                ? "Update your role requirements, salary, or deadline."
                : "Describe the role and select the DSA test difficulty."}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
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

        <form onSubmit={handleSubmit} className="card bg-base-100 border border-base-300 shadow-sm">
          <div className="card-body gap-5 p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend font-semibold">Job Title *</legend>
                <input
                  className="input w-full"
                  type="text"
                  name="title"
                  placeholder="e.g. Junior Full-Stack Engineer"
                  value={job.title}
                  onChange={handleChange}
                  required
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend font-semibold">Company Name *</legend>
                <input
                  className="input w-full"
                  type="text"
                  name="company"
                  placeholder="e.g. Acme Corp"
                  value={job.company}
                  onChange={handleChange}
                  required
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend font-semibold">Location *</legend>
                <input
                  className="input w-full"
                  type="text"
                  name="location"
                  placeholder="e.g. Remote / New York, NY"
                  value={job.location}
                  onChange={handleChange}
                  required
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend font-semibold">Employment Type *</legend>
                <select
                  className="select w-full"
                  name="typeOfEmployment"
                  value={job.typeOfEmployment}
                  onChange={handleChange}
                >
                  {EMPLOYMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend font-semibold">Coding Test Difficulty *</legend>
                <select
                  className="select w-full"
                  name="difficultyLevel"
                  value={job.difficultyLevel}
                  onChange={handleChange}
                >
                  {DIFFICULTY_LEVELS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend font-semibold">Annual Salary ($) *</legend>
                <input
                  className="input w-full"
                  type="number"
                  name="salary"
                  placeholder="e.g. 75000"
                  value={job.salary}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend font-semibold">Required Skills (Comma-separated) *</legend>
                <input
                  className="input w-full"
                  type="text"
                  name="requiredSkills"
                  value={job.requiredSkills}
                  onChange={handleChange}
                  placeholder="React, Node.js, TypeScript, SQL"
                  required
                />
              </fieldset>

              <div className="grid grid-cols-2 gap-3">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend font-semibold">Min. Experience</legend>
                  <input
                    className="input w-full"
                    type="number"
                    name="yearsOfExperience"
                    value={job.yearsOfExperience}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    step="any"
                  />
                </fieldset>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend font-semibold">Openings</legend>
                  <input
                    className="input w-full"
                    type="number"
                    name="openings"
                    value={job.openings}
                    onChange={handleChange}
                    min="1"
                  />
                </fieldset>
              </div>

              <fieldset className="fieldset">
                <legend className="fieldset-legend font-semibold">Application Deadline</legend>
                <input
                  className="input w-full"
                  type="date"
                  name="deadline"
                  value={job.deadline}
                  onChange={handleChange}
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend font-semibold">Listing Status</legend>
                <select
                  className="select w-full"
                  name="status"
                  value={job.status}
                  onChange={handleChange}
                >
                  <option value="open">Open (Accepting Applications)</option>
                  <option value="closed">Closed (Hidden)</option>
                </select>
              </fieldset>

              <fieldset className="fieldset md:col-span-2">
                <legend className="fieldset-legend font-semibold">Role Description *</legend>
                <textarea
                  className="textarea w-full h-44"
                  name="description"
                  placeholder="Detail the day-to-day responsibilities, stack, team culture, and interview expectations..."
                  value={job.description}
                  onChange={handleChange}
                  required
                />
              </fieldset>
            </div>

            <div className="flex gap-3 pt-4 border-t border-base-200">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || Boolean(message)}
              >
                {saving ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Saving...
                  </>
                ) : isEdit ? (
                  "Save Changes"
                ) : (
                  "Publish Job Posting"
                )}
              </button>

              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => navigate(-1)}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default JobPostFormPage;
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../lib/axios.js";

const EMPLOYMENT_TYPES = [
  { value: "job", label: "Job" },
  { value: "internship", label: "Internship" }
];

const DIFFICULTY_LEVELS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" }
];

const emptyJob = {
  title: "",
  company: "",
  location: "",
  description: "",
  typeOfEmployment: "job",
  requiredSkills: "", // comma-separated in the UI, converted to an array on save
  yearsOfExperience: "",
  salary: "",
  difficultyLevel: "easy",
  openings: "1",
  deadline: "",
  status: "open"
};

function JobPostFormPage() {
  const navigate = useNavigate();
  const { jobId } = useParams(); // present on /admin/jobs/:jobId/edit
  const isEdit = Boolean(jobId);

  const [job, setJob] = useState(emptyJob);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

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
          difficultyLevel: data.difficultyLevel || "easy",
          openings: data.openings ?? "1",
          deadline: data.deadline ? data.deadline.slice(0, 10) : "",
          status: data.status || "open"
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load job post");

        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [isEdit, jobId, navigate]);

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
      setError("Add at least one required skill.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);

    try {
      // postedBy is NOT sent. The backend sets it from the logged-in admin.
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
        setMessage("Job post updated successfully.");
      } else {
        await api.post("/api/jobs", payload);
        setMessage("Job post created successfully.");
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
    return <p className="p-8">Loading job post...</p>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        {isEdit ? "Edit job post" : "Create job post"}
      </h1>

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

      <form
        onSubmit={handleSubmit}
        className="card bg-base-100 border border-base-300"
      >
        <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Job title</legend>
            <input
              className="input w-full"
              type="text"
              name="title"
              value={job.title}
              onChange={handleChange}
              required
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Company</legend>
            <input
              className="input w-full"
              type="text"
              name="company"
              value={job.company}
              onChange={handleChange}
              required
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Location</legend>
            <input
              className="input w-full"
              type="text"
              name="location"
              value={job.location}
              onChange={handleChange}
              required
            />
          </fieldset>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Type of employment</legend>
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
              <legend className="fieldset-legend">Test difficulty</legend>
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
          </div>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Required skills</legend>
            <input
              className="input w-full"
              type="text"
              name="requiredSkills"
              value={job.requiredSkills}
              onChange={handleChange}
              placeholder="React, Node.js, MongoDB"
              required
            />
            <p className="label">Separate skills with commas.</p>
          </fieldset>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Salary</legend>
              <input
                className="input w-full"
                type="number"
                name="salary"
                value={job.salary}
                onChange={handleChange}
                min="0"
                step="1"
                required
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">
                Min. experience (years)
              </legend>
              <input
                className="input w-full"
                type="number"
                name="yearsOfExperience"
                value={job.yearsOfExperience}
                onChange={handleChange}
                min="0"
                step="any"
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Openings</legend>
              <input
                className="input w-full"
                type="number"
                name="openings"
                value={job.openings}
                onChange={handleChange}
                min="1"
                step="1"
              />
            </fieldset>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Application deadline</legend>
              <input
                className="input w-full"
                type="date"
                name="deadline"
                value={job.deadline}
                onChange={handleChange}
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Status</legend>
              <select
                className="select w-full"
                name="status"
                value={job.status}
                onChange={handleChange}
              >
                <option value="open">Open (visible to candidates)</option>
                <option value="closed">Closed (hidden)</option>
              </select>
            </fieldset>
          </div>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Description</legend>
            <textarea
              className="textarea w-full h-40"
              name="description"
              value={job.description}
              onChange={handleChange}
              required
            />
          </fieldset>

          <div className="flex gap-3">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || Boolean(message)}
            >
              {saving
                ? "Saving..."
                : isEdit
                ? "Save changes"
                : "Publish job post"}
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
  );
}

export default JobPostFormPage;
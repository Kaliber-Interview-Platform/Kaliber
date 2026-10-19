import { useState, useEffect } from "react";
import api from "../lib/axios.js";
import NavBar from "../components/NavBar.jsx";
import Loader from "../components/Loader.jsx";

const emptyQuestion = {
  title: "",
  description: "",
  difficulty: "easy",
  constraints: "",
  sampleInput: "",
  sampleOutput: "",
  tags: "",
  testCases: [{ input: "", expectedOutput: "" }]
};

export default function QuestionCreationPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyQuestion);
  const [submitting, setSubmitting] = useState(false);

  const fetchQuestions = async () => {
    try {
      const url =
        filterDifficulty !== "all"
          ? `/api/questions?difficulty=${filterDifficulty}`
          : "/api/questions";
      const res = await api.get(url);
      setQuestions(res.data.questions || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [filterDifficulty]);

  const showNotice = (text) => {
    setNotice(text);
    setTimeout(() => setNotice(""), 3500);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(emptyQuestion);
    setModalOpen(true);
  };

  const handleOpenEdit = (q) => {
    setEditingId(q._id);
    setFormData({
      title: q.title || "",
      description: q.description || "",
      difficulty: q.difficulty || "easy",
      constraints: q.constraints || "",
      sampleInput: q.sampleInput || "",
      sampleOutput: q.sampleOutput || "",
      tags: (q.tags || []).join(", "),
      testCases: q.testCases && q.testCases.length > 0 ? q.testCases : [{ input: "", expectedOutput: "" }]
    });
    setModalOpen(true);
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete question "${title}"?`)) return;

    try {
      await api.delete(`/api/questions/${id}`);
      setQuestions((prev) => prev.filter((q) => q._id !== id));
      showNotice("Question deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete question");
    }
  };

  const handleAddTestCase = () => {
    setFormData((prev) => ({
      ...prev,
      testCases: [...prev.testCases, { input: "", expectedOutput: "" }]
    }));
  };

  const handleRemoveTestCase = (index) => {
    setFormData((prev) => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index)
    }));
  };

  const handleTestCaseChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.testCases];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, testCases: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        difficulty: formData.difficulty,
        constraints: formData.constraints.trim(),
        sampleInput: formData.sampleInput.trim(),
        sampleOutput: formData.sampleOutput.trim(),
        tags: formData.tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
        testCases: formData.testCases.filter((tc) => tc.input.trim() || tc.expectedOutput.trim())
      };

      if (editingId) {
        const res = await api.put(`/api/questions/${editingId}`, payload);
        setQuestions((prev) =>
          prev.map((q) => (q._id === editingId ? res.data.question : q))
        );
        showNotice("Question updated successfully!");
      } else {
        const res = await api.post("/api/questions", payload);
        setQuestions((prev) => [res.data.question, ...prev]);
        showNotice("Question created and added to bank!");
      }

      setModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save question");
    } finally {
      setSubmitting(false);
    }
  };

  const visibleQuestions = questions.filter((q) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      q.title.toLowerCase().includes(term) ||
      q.description.toLowerCase().includes(term) ||
      q.tags?.some((t) => t.toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      <NavBar />

      <div className="max-w-6xl mx-auto w-full p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Question Bank</h1>
            <p className="text-sm opacity-70 mt-1">
              Manage coding challenge problems, test cases, and difficulty tiers.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn btn-primary btn-sm shadow-sm"
          >
            + Create Question
          </button>
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

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-base-100 p-4 rounded-xl border border-base-300 shadow-xs">
          <input
            type="text"
            className="input w-full"
            placeholder="Search problems by title, topic, or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="select w-full sm:w-48"
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {loading ? (
          <Loader message="Loading question bank..." />
        ) : visibleQuestions.length === 0 ? (
          <div className="card bg-base-100 border border-base-300 p-12 text-center shadow-xs">
            <h2 className="text-xl font-bold">No Questions Found</h2>
            <p className="text-sm opacity-70 mt-1 mb-6">
              There are no coding questions matching your filters.
            </p>
            <div>
              <button type="button" onClick={handleOpenAdd} className="btn btn-primary btn-sm">
                Add Your First Question
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleQuestions.map((q) => {
              const diffColors = {
                easy: "badge-success",
                medium: "badge-warning",
                hard: "badge-error"
              };

              return (
                <div
                  key={q._id}
                  className="card bg-base-100 border border-base-300 shadow-xs hover:shadow-md transition-shadow"
                >
                  <div className="card-body p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold">{q.title}</h3>
                          <span
                            className={`badge uppercase font-semibold text-xs ${
                              diffColors[q.difficulty] || "badge-ghost"
                            }`}
                          >
                            {q.difficulty}
                          </span>
                          <span className="text-xs opacity-60">
                            {q.testCases?.length || 0} test cases
                          </span>
                        </div>
                        <p className="text-sm opacity-80 mt-2 line-clamp-2">
                          {q.description}
                        </p>
                        {q.tags && q.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {q.tags.map((t) => (
                              <span key={t} className="badge badge-outline badge-xs opacity-75">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(q)}
                          className="btn btn-outline btn-xs"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(q._id, q.title)}
                          className="btn btn-outline btn-error btn-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal for Add/Edit */}
        {modalOpen && (
          <dialog className="modal modal-open">
            <div className="modal-box max-w-3xl">
              <h3 className="font-bold text-xl mb-4">
                {editingId ? "Edit Question" : "Create New Coding Question"}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend font-semibold">Title *</legend>
                    <input
                      type="text"
                      className="input w-full"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                    />
                  </fieldset>

                  <fieldset className="fieldset">
                    <legend className="fieldset-legend font-semibold">Difficulty *</legend>
                    <select
                      className="select w-full"
                      value={formData.difficulty}
                      onChange={(e) =>
                        setFormData({ ...formData, difficulty: e.target.value })
                      }
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </fieldset>
                </div>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend font-semibold">Description *</legend>
                  <textarea
                    className="textarea w-full h-32"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Problem statement and input/output instructions..."
                    required
                  />
                </fieldset>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend font-semibold">Constraints</legend>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="e.g. 1 <= n <= 10^5, time complexity O(n)"
                    value={formData.constraints}
                    onChange={(e) =>
                      setFormData({ ...formData, constraints: e.target.value })
                    }
                  />
                </fieldset>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend font-semibold">Sample Input</legend>
                    <textarea
                      className="textarea w-full h-20 font-mono text-xs"
                      placeholder="e.g. 1 2 3"
                      value={formData.sampleInput}
                      onChange={(e) =>
                        setFormData({ ...formData, sampleInput: e.target.value })
                      }
                    />
                  </fieldset>

                  <fieldset className="fieldset">
                    <legend className="fieldset-legend font-semibold">Sample Output</legend>
                    <textarea
                      className="textarea w-full h-20 font-mono text-xs"
                      placeholder="e.g. 6"
                      value={formData.sampleOutput}
                      onChange={(e) =>
                        setFormData({ ...formData, sampleOutput: e.target.value })
                      }
                    />
                  </fieldset>
                </div>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend font-semibold">Tags (Comma-separated)</legend>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="arrays, dynamic-programming, hash-map"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                  />
                </fieldset>

                {/* Test Cases Builder */}
                <div className="border border-base-300 rounded-xl p-4 bg-base-200/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm">Grading Test Cases</span>
                    <button
                      type="button"
                      onClick={handleAddTestCase}
                      className="btn btn-outline btn-xs btn-primary"
                    >
                      + Add Test Case
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.testCases.map((tc, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row items-center gap-2 bg-base-100 p-2.5 rounded-lg border border-base-300"
                      >
                        <span className="text-xs font-mono font-bold w-6">#{idx + 1}</span>
                        <input
                          type="text"
                          className="input input-sm w-full font-mono text-xs"
                          placeholder="Input (stdin)"
                          value={tc.input}
                          onChange={(e) =>
                            handleTestCaseChange(idx, "input", e.target.value)
                          }
                          required
                        />
                        <input
                          type="text"
                          className="input input-sm w-full font-mono text-xs"
                          placeholder="Expected Output (stdout)"
                          value={tc.expectedOutput}
                          onChange={(e) =>
                            handleTestCaseChange(idx, "expectedOutput", e.target.value)
                          }
                          required
                        />
                        {formData.testCases.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTestCase(idx)}
                            className="btn btn-ghost btn-xs text-error"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="modal-action">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setModalOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? "Saving..." : editingId ? "Update Question" : "Create Question"}
                  </button>
                </div>
              </form>
            </div>
          </dialog>
        )}
      </div>
    </div>
  );
}

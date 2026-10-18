import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/axios.js";

function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "candidate" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/api/auth/register", form);

      const { token, ...user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/login", {state: {message: "Account created. Please log in."}});
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not reach the server. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="card bg-base-100 border border-base-300 w-full max-w-sm"
      >
        <div className="card-body gap-3">
          <h1 className="card-title text-2xl">Create your account</h1>

          {error && (
            <div role="alert" className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Full name</legend>
            <input
              type="text"
              name="name"
              className="input w-full"
              value={form.name}
              onChange={handleChange}
              required
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Email</legend>
            <input
              type="email"
              name="email"
              className="input w-full"
              value={form.email}
              onChange={handleChange}
              required
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Password</legend>
            <input
              type="password"
              name="password"
              className="input w-full"
              value={form.password}
              onChange={handleChange}
              minLength={6}
              required
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">I am a</legend>
            <select
              name="role"
              className="select w-full"
              value={form.role}
              onChange={handleChange}
            >
              <option value="candidate">Candidate looking for a job</option>
              <option value="admin">Recruiter posting jobs</option>
            </select>
          </fieldset>

          <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
            {loading ? <span className="loading loading-spinner loading-sm" /> : "Create account"}
          </button>

          <p className="text-sm text-center">
            Already have an account?{" "}
            <Link to="/login" className="link link-primary">
              Log in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

export default SignupPage;
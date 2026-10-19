import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/UseAuth.js";
import NavBar from "../components/NavBar.jsx";

function SignupPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "candidate"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await register(form);
      // If token and session was established, route to home
      if (res?.token || localStorage.getItem("token")) {
        navigate("/");
      } else {
        navigate("/login", {
          state: { message: "Account created successfully! Please log in." }
        });
      }
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
    <div className="min-h-screen bg-base-200 flex flex-col">
      <NavBar />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <form
          onSubmit={handleSubmit}
          className="card bg-base-100 border border-base-300 w-full max-w-sm shadow-md"
        >
          <div className="card-body gap-3">
            <h1 className="card-title text-2xl font-bold">Create your account</h1>
            <p className="text-xs opacity-70">
              Join Kaliber to get hired on how you code or recruit top CS talent.
            </p>

            {error && (
              <div role="alert" className="alert alert-error text-xs py-2">
                <span>{error}</span>
              </div>
            )}

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Full name</legend>
              <input
                type="text"
                name="name"
                className="input w-full"
                placeholder="Jane Doe"
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
                placeholder="jane@example.com"
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
                placeholder="At least 6 characters"
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
                <option value="candidate">Candidate (looking for a job)</option>
                <option value="admin">Recruiter (posting jobs & hiring)</option>
              </select>
            </fieldset>

            <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm" /> : "Create account"}
            </button>

            <p className="text-sm text-center mt-2 opacity-80">
              Already have an account?{" "}
              <Link to="/login" className="link link-primary font-semibold">
                Log in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SignupPage;
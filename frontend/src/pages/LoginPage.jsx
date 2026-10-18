import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../lib/axios.js";

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const registeredMessage = location.state?.message;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/api/auth/login", form);
      localStorage.setItem("token",res.data.token)

      // backend returns { _id, name, email, role, token }
      const profileRes=await api.get("/api/users/profile")
      localStorage.setItem("user", JSON.stringify(profileRes.data.user));

      navigate("/");
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
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="card bg-base-100 border border-base-300 w-full max-w-sm"
      >
        <div className="card-body gap-3">
          <h1 className="card-title text-2xl">Log in to Kalliber</h1>

          {registeredMessage && (
            <div role="status" className="alert alert-success">
              <span>{registeredMessage}</span>
            </div>
          )}

          {error && (
            <div role="alert" className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

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
              required
            />
          </fieldset>

          <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
            {loading ? <span className="loading loading-spinner loading-sm" /> : "Log in"}
          </button>

          <p className="text-sm text-center">
            New here?{" "}
            <Link to="/signup" className="link link-primary">
              Create an account
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;
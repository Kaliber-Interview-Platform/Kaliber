import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/UseAuth.js";
import NavBar from "../components/NavBar.jsx";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const registeredMessage = location.state?.message;
  const redirectPath = location.state?.from?.pathname || "/";

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(form.email, form.password);
      navigate(redirectPath, { replace: true });
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
            <h1 className="card-title text-2xl font-bold">Log in to Kaliber</h1>
            <p className="text-xs opacity-70">
              Welcome back! Please enter your credentials to access your account.
            </p>

            {registeredMessage && (
              <div role="status" className="alert alert-success text-xs py-2">
                <span>{registeredMessage}</span>
              </div>
            )}

            {error && (
              <div role="alert" className="alert alert-error text-xs py-2">
                <span>{error}</span>
              </div>
            )}

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Email</legend>
              <input
                type="email"
                name="email"
                className="input w-full"
                placeholder="name@example.com"
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
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
            </fieldset>

            <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm" /> : "Log in"}
            </button>

            <p className="text-sm text-center mt-2 opacity-80">
              New to Kaliber?{" "}
              <Link to="/signup" className="link link-primary font-semibold">
                Create an account
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
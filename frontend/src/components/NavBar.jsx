import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/UseAuth.js";
import NotificationBell from "./NotificationBell.jsx";
import { useState, useEffect } from "react";

export default function NavBar() {
  const { user, isAuthenticated, isAdmin, isCandidate, logout } = useAuth();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="navbar bg-base-100 border-b border-base-300 px-4 sm:px-8 sticky top-0 z-40 shadow-xs">
      <div className="navbar-start gap-2">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-content flex items-center justify-center font-black text-lg shadow-sm">
            K
          </div>
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Kaliber
          </span>
        </Link>

        {isAuthenticated && (
          <div className="hidden md:flex items-center gap-1 ml-6 text-sm font-medium">
            <Link to="/" className="btn btn-ghost btn-sm">
              Jobs
            </Link>

            {isCandidate && (
              <Link to="/applications/mine" className="btn btn-ghost btn-sm">
                My Applications
              </Link>
            )}

            {isAdmin && (
              <>
                <Link to="/admin/applications" className="btn btn-ghost btn-sm">
                  Track Applicants
                </Link>
                <Link to="/admin/jobs/new" className="btn btn-ghost btn-sm">
                  + Post Job
                </Link>
                <Link to="/admin/questions" className="btn btn-ghost btn-sm">
                  Question Bank
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      <div className="navbar-end gap-2 sm:gap-3">
        {/* Theme toggle button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="btn btn-ghost btn-circle btn-sm"
          aria-label="Toggle theme"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {isAuthenticated ? (
          <>
            <NotificationBell />

            <div className="dropdown dropdown-end">
              <button
                tabIndex={0}
                type="button"
                className="btn btn-ghost btn-circle avatar placeholder"
              >
                <div className="bg-primary text-primary-content rounded-full w-9">
                  <span className="text-sm font-bold">
                    {(user?.name || "U")[0].toUpperCase()}
                  </span>
                </div>
              </button>

              <ul
                tabIndex={0}
                className="menu dropdown-content bg-base-100 rounded-box z-50 mt-3 w-56 p-2 shadow-lg border border-base-300"
              >
                <li className="menu-title px-4 py-2 border-b border-base-200">
                  <span className="font-bold text-sm text-base-content block">
                    {user?.name || "User"}
                  </span>
                  <span className="text-xs font-normal opacity-70 block capitalize">
                    {user?.role === "admin" ? "Recruiter (Admin)" : "Candidate"}
                  </span>
                </li>

                <li className="mt-1">
                  <Link to="/profile">My Profile</Link>
                </li>

                {isCandidate && (
                  <li>
                    <Link to="/applications/mine">My Applications</Link>
                  </li>
                )}

                {isAdmin && (
                  <>
                    <li>
                      <Link to="/admin/applications">Track Applicants</Link>
                    </li>
                    <li>
                      <Link to="/admin/jobs/new">Post a Job</Link>
                    </li>
                    <li>
                      <Link to="/admin/questions">Question Bank</Link>
                    </li>
                  </>
                )}

                <li>
                  <Link to="/notifications">Notifications</Link>
                </li>

                <li className="border-t border-base-200 mt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-error font-medium"
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn btn-ghost btn-sm">
              Log in
            </Link>
            <Link to="/signup" className="btn btn-primary btn-sm">
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-7xl font-extrabold text-primary">404</h1>
      <h2 className="text-2xl font-bold mt-4">Page Not Found</h2>
      <p className="mt-2 text-base opacity-70 max-w-md">
        The page you are looking for does not exist or might have been moved.
      </p>
      <Link to="/" className="btn btn-primary mt-6">
        Return to Home
      </Link>
    </div>
  );
}

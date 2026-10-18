import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import JobPostFormPage from "./pages/JobPostFormPage.jsx";
import AdminTrackingPage from "./pages/AdminTrackingPage.jsx";
import ResumeSubmit from "./pages/ResumeSubmit.jsx";

function App() {
  return (
    <div className="min-h-screen bg-base-200">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/profile" element={<ProfilePage/>} />
        <Route path="/admin/jobs/new" element={<JobPostFormPage/>} />
        <Route path="/admin/jobs/:jobId/edit" element={<JobPostFormPage/>} />
        <Route path="/jobs/:jobId/apply" element={<ResumeSubmit />} />
        <Route path="/admin/applications" element={<AdminTrackingPage />} />


      </Routes>
    </div>
  );
}

export default App;
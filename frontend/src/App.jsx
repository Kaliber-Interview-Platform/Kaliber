import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import JobPostFormPage from "./pages/JobPostFormPage.jsx";
import AdminTrackingPage from "./pages/AdminTrackingPage.jsx";
import CandidateApplicationsPage from "./pages/CandidateApplicationsPage.jsx";
import CandidateProfilePage from "./pages/CandidateProfilePage.jsx";
import QuestionCreationPage from "./pages/QuestionCreationPage.jsx";
import InterviewPage from "./pages/InterviewPage.jsx";
import ReportPage from "./pages/ReportPage.jsx";
import NotificationPage from "./pages/NotificationPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import NotFound from "./components/NotFound.jsx";

function App() {
  return (
    <div className="min-h-screen bg-base-200">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Authenticated Routes (Any Role) */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationPage />
            </ProtectedRoute>
          }
        />

        {/* Candidate-Only Routes */}
        <Route
          path="/applications/mine"
          element={
            <ProtectedRoute allowedRoles={["candidate"]}>
              <CandidateApplicationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/test/:testInstanceId"
          element={
            <ProtectedRoute allowedRoles={["candidate"]}>
              <InterviewPage />
            </ProtectedRoute>
          }
        />

        {/* Admin/Recruiter-Only Routes */}
        <Route
          path="/admin/jobs/new"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <JobPostFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/jobs/:jobId/edit"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <JobPostFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/applications"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminTrackingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/candidates/:candidateId"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CandidateProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/questions"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <QuestionCreationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports/:applicationId"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ReportPage />
            </ProtectedRoute>
          }
        />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
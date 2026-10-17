// small helpers shared across pages

// "2026-10-17T10:30:00Z" -> "17 Oct 2026"
export const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};

// 754 seconds -> "12:34" (for the test timer and for showing time taken in reports)
export const formatDuration = (totalSeconds) => {
  if (totalSeconds == null) return "";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

// reads the logged-in user saved by the login/signup pages, or null if nobody is logged in
export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};
import { useState, useEffect } from "react";
import { formatDuration } from "../lib/utils.js";

export default function Timer({ expiresAt, onExpire }) {
  const calculateRemaining = () => {
    if (!expiresAt) return 0;
    const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  };

  const [remaining, setRemaining] = useState(calculateRemaining);

  useEffect(() => {
    setRemaining(calculateRemaining());

    const interval = setInterval(() => {
      const sec = calculateRemaining();
      setRemaining(sec);

      if (sec <= 0) {
        clearInterval(interval);
        if (onExpire) {
          onExpire();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const isCritical = remaining < 60; // < 1 min
  const isWarning = remaining < 300 && !isCritical; // < 5 mins

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-bold text-sm transition-colors ${
        isCritical
          ? "border-error bg-error/15 text-error animate-pulse"
          : isWarning
          ? "border-warning bg-warning/15 text-warning"
          : "border-base-300 bg-base-200 text-base-content"
      }`}
      aria-label="Test timer"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-4 w-4 ${isCritical ? "animate-spin" : ""}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{formatDuration(remaining) || "0:00"}</span>
    </div>
  );
}

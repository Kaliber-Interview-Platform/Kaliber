export default function JobCard({
  job,
  canApply,
  canManage,
  hasApplied,
  onApply,
  onEdit,
  onDelete
}) {
  const closed = job.status === "closed";
  const experience = `${job.yearsOfExperience ?? 0}+ years exp`;

  const difficultyColors = {
    easy: "badge-success",
    medium: "badge-warning",
    hard: "badge-error"
  };

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow">
      <div className="card-body gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="card-title text-lg font-bold hover:text-primary transition-colors">
              {job.title}
            </h3>
            <p className="text-sm font-medium opacity-75">
              {job.company} • <span className="opacity-80">{job.location}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`badge ${closed ? "badge-ghost" : "badge-success badge-soft"}`}>
              {closed ? "Closed" : "Open"}
            </span>
            {job.difficultyLevel && (
              <span className={`badge badge-xs font-semibold uppercase ${difficultyColors[job.difficultyLevel] || "badge-ghost"}`}>
                {job.difficultyLevel}
              </span>
            )}
          </div>
        </div>

        <p className="text-sm opacity-80 line-clamp-3 my-1">
          {job.description}
        </p>

        <div className="flex flex-wrap gap-1.5 my-1">
          {job.requiredSkills?.map((skill) => (
            <span key={skill} className="badge badge-outline badge-sm text-xs">
              {skill}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-y-2 text-xs opacity-75 pt-2 border-t border-base-200">
          <span>{experience}</span>
          <span>${job.salary ? Number(job.salary).toLocaleString() : "Competitive"}</span>
          <span>{job.openings || 1} open role{job.openings > 1 ? "s" : ""}</span>
          {job.deadline && (
            <span>Ends: {new Date(job.deadline).toLocaleDateString()}</span>
          )}
        </div>

        {(canApply || canManage) && (
          <div className="card-actions justify-end pt-2 mt-auto">
            {canApply && (
              <button
                type="button"
                className={`btn btn-sm ${hasApplied ? "btn-disabled" : "btn-primary"}`}
                disabled={closed || hasApplied}
                onClick={() => onApply && onApply(job._id)}
              >
                {hasApplied ? "Applied ✓" : "Apply Now"}
              </button>
            )}

            {canManage && (
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => onEdit && onEdit(job._id)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-error btn-sm"
                  onClick={() => onDelete && onDelete(job)}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

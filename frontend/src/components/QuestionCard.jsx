export default function QuestionCard({ question, questionIndex, isPassed }) {
  if (!question) return null;

  const difficultyColors = {
    easy: "badge-success",
    medium: "badge-warning",
    hard: "badge-error"
  };

  return (
    <div className="card bg-base-100 border border-base-300 shadow-xs">
      <div className="card-body gap-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-base-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="badge badge-neutral font-mono font-bold">
              Q{questionIndex != null ? questionIndex + 1 : ""}
            </span>
            <h2 className="text-xl font-bold">{question.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`badge font-semibold uppercase text-xs ${
                difficultyColors[question.difficulty] || "badge-ghost"
              }`}
            >
              {question.difficulty}
            </span>
            {isPassed ? (
              <span className="badge badge-success badge-soft font-semibold">
                Passed ✓
              </span>
            ) : (
              <span className="badge badge-ghost badge-soft text-xs">
                Pending
              </span>
            )}
          </div>
        </div>

        <div className="prose max-w-none text-sm leading-relaxed whitespace-pre-wrap">
          {question.description}
        </div>

        {question.constraints && (
          <div className="mt-2 text-xs bg-base-200/60 p-3 rounded-lg border border-base-200">
            <span className="font-bold block mb-1">Constraints:</span>
            <pre className="whitespace-pre-wrap font-mono text-xs opacity-80">
              {question.constraints}
            </pre>
          </div>
        )}

        {(question.sampleInput || question.sampleOutput) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            {question.sampleInput && (
              <div className="bg-base-200 p-3 rounded-lg border border-base-300">
                <span className="text-xs font-bold block mb-1">Sample Input:</span>
                <pre className="font-mono text-xs">{question.sampleInput}</pre>
              </div>
            )}
            {question.sampleOutput && (
              <div className="bg-base-200 p-3 rounded-lg border border-base-300">
                <span className="text-xs font-bold block mb-1">Sample Output:</span>
                <pre className="font-mono text-xs">{question.sampleOutput}</pre>
              </div>
            )}
          </div>
        )}

        {question.tags && question.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {question.tags.map((tag) => (
              <span key={tag} className="badge badge-outline badge-xs opacity-75">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

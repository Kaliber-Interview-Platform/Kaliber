import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../lib/axios.js";
import useAuth from "../hooks/UseAuth.js";
import Timer from "../components/Timer.jsx";
import QuestionCard from "../components/QuestionCard.jsx";
import Loader from "../components/Loader.jsx";

const STARTER_TEMPLATES = {
  javascript: `// Write your solution here
// Read from standard input using readline() if needed

function solve() {
  const line = readline();
  // TODO: Implement solution
  console.log(line);
}

solve();
`,
  python: `# Write your solution here
# Read from standard input using sys.stdin.readline or input()
import sys

def main():
    line = sys.stdin.readline().strip()
    # TODO: Implement solution
    print(line)

if __name__ == '__main__':
    main()
`,
  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (scanner.hasNextLine()) {
            String line = scanner.nextLine();
            // TODO: Implement solution
            System.out.println(line);
        }
    }
}
`,
  cpp: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string line;
    if (getline(cin, line)) {
        // TODO: Implement solution
        cout << line << endl;
    }
    return 0;
}
`,
  c: `#include <stdio.h>

int main() {
    char buffer[1024];
    if (fgets(buffer, sizeof(buffer), stdin)) {
        // TODO: Implement solution
        printf("%s", buffer);
    }
    return 0;
}
`
};

export default function InterviewPage() {
  const { testInstanceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [testInstance, setTestInstance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  // Editor states
  const [language, setLanguage] = useState("javascript");
  const [codePerQuestion, setCodePerQuestion] = useState({});
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [completedSummary, setCompletedSummary] = useState(null);

  const fetchTest = async () => {
    try {
      const res = await api.get(`/api/tests/${testInstanceId}`);
      const test = res.data.testInstance;
      setTestInstance(test);

      // Pre-fill existing submitted code if any
      const initialCode = {};
      test.questions?.forEach((q, idx) => {
        initialCode[q.question?._id || idx] = q.code || STARTER_TEMPLATES["javascript"];
      });
      setCodePerQuestion(initialCode);

      // If test is already completed
      if (test.status === "completed" || test.completedAt) {
        setCompletedSummary({
          score: test.score,
          total: test.questions?.length || 0
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load test instance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTest();
  }, [testInstanceId]);

  const activeQuestionEntry = testInstance?.questions?.[activeQuestionIdx];
  const activeQuestion = activeQuestionEntry?.question;
  const activeQuestionId = activeQuestion?._id || activeQuestionEntry?.question;

  const currentCode =
    codePerQuestion[activeQuestionId] ?? STARTER_TEMPLATES[language] ?? "";

  const handleCodeChange = (e) => {
    const val = e.target.value;
    setCodePerQuestion((prev) => ({
      ...prev,
      [activeQuestionId]: val
    }));
  };

  // Support tab indentation in textarea
  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const val = e.target.value;
      const newVal = val.substring(0, start) + "  " + val.substring(end);

      setCodePerQuestion((prev) => ({
        ...prev,
        [activeQuestionId]: newVal
      }));

      // Reset caret position after react re-renders
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    // If the editor is currently template-default, swap template
    const current = codePerQuestion[activeQuestionId];
    if (!current || Object.values(STARTER_TEMPLATES).includes(current)) {
      setCodePerQuestion((prev) => ({
        ...prev,
        [activeQuestionId]: STARTER_TEMPLATES[newLang]
      }));
    }
  };

  const handleRunAndSubmitAnswer = async () => {
    if (!activeQuestionId) return;
    setRunning(true);
    setRunResult(null);

    try {
      const res = await api.post(
        `/api/tests/${testInstanceId}/question/${activeQuestionId}`,
        {
          code: currentCode,
          language
        }
      );

      setRunResult(res.data);

      // Update question pass status in state
      setTestInstance((prev) => {
        if (!prev) return prev;
        const updatedQuestions = [...prev.questions];
        if (updatedQuestions[activeQuestionIdx]) {
          updatedQuestions[activeQuestionIdx] = {
            ...updatedQuestions[activeQuestionIdx],
            passed: res.data.passed,
            code: currentCode
          };
        }
        return { ...prev, questions: updatedQuestions };
      });
    } catch (err) {
      setRunResult({
        error: err.response?.data?.message || "Execution error or timeout"
      });
    } finally {
      setRunning(false);
    }
  };

  const handleCompleteTest = async () => {
    if (
      !window.confirm(
        "Are you sure you want to finish and submit your entire assessment? You will not be able to change your answers."
      )
    ) {
      return;
    }

    setCompleting(true);

    try {
      const res = await api.post(`/api/tests/${testInstanceId}/complete`);
      setCompletedSummary(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit test");
      setCompleting(false);
    }
  };

  const handleAutoExpire = async () => {
    // Called when the countdown timer hits 0
    try {
      const res = await api.post(`/api/tests/${testInstanceId}/complete`);
      setCompletedSummary(res.data);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return <Loader message="Setting up your coding assessment environment..." />;
  }

  if (completedSummary) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="card bg-base-100 border border-base-300 w-full max-w-lg text-center p-8 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-success/20 text-success flex items-center justify-center text-3xl mx-auto mb-4">
            ✓
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Assessment Submitted!</h1>
          <p className="text-sm opacity-70 mt-2 mb-6">
            Your solutions have been automatically graded. The hiring team has been notified
            and will review your code and scores.
          </p>

          <div className="bg-base-200 p-6 rounded-2xl border border-base-300 mb-6">
            <span className="text-xs uppercase font-bold tracking-wider opacity-70 block mb-1">
              Final Score
            </span>
            <div className="text-5xl font-black text-primary">
              {completedSummary.score} / {completedSummary.total || testInstance?.questions?.length || 0}
            </div>
            <span className="text-xs opacity-60 block mt-2">
              Problems Passed Successfully
            </span>
          </div>

          <Link to="/applications/mine" className="btn btn-primary w-full">
            Return to My Applications
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="card bg-base-100 border border-base-300 max-w-md p-6 text-center">
          <h2 className="text-xl font-bold text-error">Unable to Load Assessment</h2>
          <p className="text-sm opacity-75 mt-2 mb-4">{error}</p>
          <Link to="/applications/mine" className="btn btn-outline btn-sm">
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  const questionsList = testInstance?.questions || [];

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      {/* Test Top Navigation Bar */}
      <header className="bg-base-100 border-b border-base-300 px-4 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="badge badge-primary font-bold">Kaliber Assessment</span>
          <span className="text-xs uppercase font-semibold opacity-70">
            {testInstance?.difficultyLevel} Tier
          </span>
        </div>

        {/* Question Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
          {questionsList.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setActiveQuestionIdx(idx);
                setRunResult(null);
              }}
              className={`btn btn-xs font-mono ${
                activeQuestionIdx === idx
                  ? "btn-primary font-bold shadow-xs"
                  : q.passed
                  ? "btn-success btn-soft"
                  : "btn-ghost"
              }`}
            >
              Q{idx + 1} {q.passed ? "✓" : ""}
            </button>
          ))}
        </div>

        {/* Timer & Final Submit Button */}
        <div className="flex items-center gap-3">
          {testInstance?.expiresAt && (
            <Timer expiresAt={testInstance.expiresAt} onExpire={handleAutoExpire} />
          )}

          <button
            type="button"
            onClick={handleCompleteTest}
            disabled={completing}
            className="btn btn-success btn-sm font-semibold shadow-xs"
          >
            {completing ? "Submitting..." : "Finish Assessment"}
          </button>
        </div>
      </header>

      {/* Main Two-Column Code Workspace */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 max-w-[1920px] mx-auto w-full">
        {/* Left Column: Problem Statement */}
        <div className="overflow-y-auto space-y-4 max-h-[calc(100vh-5rem)]">
          <QuestionCard
            question={activeQuestion}
            questionIndex={activeQuestionIdx}
            isPassed={activeQuestionEntry?.passed}
          />
        </div>

        {/* Right Column: Code Editor & Execution Console */}
        <div className="flex flex-col gap-3 max-h-[calc(100vh-5rem)]">
          {/* Editor Header Bar */}
          <div className="bg-base-100 p-3 rounded-xl border border-base-300 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold opacity-70">Language:</span>
              <select
                className="select select-sm select-bordered"
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
              >
                <option value="javascript">JavaScript (Node.js)</option>
                <option value="python">Python 3</option>
                <option value="java">Java 15+</option>
                <option value="cpp">C++ (GCC)</option>
                <option value="c">C (GCC)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleRunAndSubmitAnswer}
              disabled={running}
              className="btn btn-primary btn-sm font-semibold shadow-xs"
            >
              {running ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  Grading Code...
                </>
              ) : (
                "▶ Run & Check Test Cases"
              )}
            </button>
          </div>

          {/* Monospace Code Editor Area */}
          <div className="relative flex-1 min-h-[350px] bg-base-900 rounded-xl overflow-hidden border border-base-300 shadow-inner flex flex-col">
            <textarea
              className="w-full h-full flex-1 p-4 bg-neutral-900 text-neutral-100 font-mono text-sm leading-relaxed resize-none focus:outline-hidden"
              spellCheck="false"
              autoCapitalize="off"
              autoComplete="off"
              value={currentCode}
              onChange={handleCodeChange}
              onKeyDown={handleKeyDown}
              placeholder="// Write your solution code here..."
            />
          </div>

          {/* Execution Output Console */}
          <div className="bg-base-100 p-4 rounded-xl border border-base-300 shadow-xs max-h-64 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-base-200 pb-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                Evaluation Output
              </span>
              {runResult && (
                <span
                  className={`badge font-bold text-xs ${
                    runResult.passed
                      ? "badge-success"
                      : "badge-error"
                  }`}
                >
                  {runResult.passed ? "Accepted ✓" : "Failed Test Cases"}
                </span>
              )}
            </div>

            {!runResult && !running && (
              <p className="text-xs opacity-50 font-mono py-2">
                Click "Run & Check Test Cases" to evaluate your solution against test cases.
              </p>
            )}

            {running && (
              <div className="flex items-center gap-2 text-xs font-mono opacity-70 py-2">
                <span className="loading loading-dots loading-xs" />
                Compiling and running against test cases...
              </div>
            )}

            {runResult?.error && (
              <div className="alert alert-error text-xs py-2 my-1">
                <span>{runResult.error}</span>
              </div>
            )}

            {runResult?.results && (
              <div className="space-y-2 mt-2">
                {runResult.results.map((r, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-lg border text-xs font-mono ${
                      r.passed
                        ? "border-success/30 bg-success/5"
                        : "border-error/30 bg-error/5"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">Test Case #{i + 1}</span>
                      <span
                        className={`badge badge-xs font-semibold ${
                          r.passed ? "badge-success" : "badge-error"
                        }`}
                      >
                        {r.passed ? "Passed" : "Wrong Output"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] opacity-85 mt-1">
                      <div>
                        <span className="opacity-60 block">Input:</span>
                        <code className="bg-base-200 px-1 py-0.5 rounded">{r.input}</code>
                      </div>
                      <div>
                        <span className="opacity-60 block">Expected:</span>
                        <code className="bg-base-200 px-1 py-0.5 rounded">{r.expectedOutput}</code>
                      </div>
                      <div className="col-span-full">
                        <span className="opacity-60 block">Your Output:</span>
                        <code className="bg-base-200 px-1 py-0.5 rounded">
                          {r.actualOutput || (r.stderr ? `Error: ${r.stderr}` : "<empty>")}
                        </code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

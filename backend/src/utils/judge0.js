import axios from "axios";

// Now uses onlinecompiler.io instead of Judge0. File name and exports are kept
// the same so testController.js doesn't need any changes.
// Note: no plain Node.js here - their JavaScript option is Deno (typescript-deno),
// which doesn't support require('fs'), so it's left out on purpose.
export const LANGUAGE_IDS = {
  python: "python-3.14",
  cpp: "g++-15",
  c: "gcc-15",
  java: "openjdk-25"
};

const API_URL = "https://api.onlinecompiler.io/api/run-code-sync/";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// runs ONE piece of code against ONE input, returns a cleaned-up result.
// retries a few times if their server says it's busy (429 = max 4 concurrent requests)
const runOnce = async (sourceCode, compiler, stdin) => {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await axios.post(
        API_URL,
        { compiler, code: sourceCode, input: stdin || "" },
        {
          headers: {
            Authorization: process.env.ONLINECOMPILER_API_KEY, // raw key, no "Bearer "
            "Content-Type": "application/json"
          },
          timeout: 35000 // their own limit is 30s
        }
      );

      const result = response.data;
      return {
        stdout: (result.output || "").replace(/\r\n/g, "\n").trim(),
        stderr: (result.error || "").trim(),
        exitCode: result.exit_code,
        status: result.status // "success" or "error"
      };
    } catch (err) {
      const busy = err.response && err.response.status === 429;
      if (busy && attempt < 3) {
        await sleep(1000); // wait a second, then try again
        continue;
      }
      throw err; // real failure (bad key, network down, still busy after 3 tries)
    }
  }
};

// runs one candidate's code against ALL of a question's test cases,
// returns whether it passed overall plus per-test-case detail
export const gradeSubmission = async (sourceCode, compiler, testCases) => {
  const results = [];

  for (const testCase of testCases) {
    const run = await runOnce(sourceCode, compiler, testCase.input);

    // exit code 0 = program ran without crashing; then compare output to expected
    const passed =
      run.exitCode === 0 &&
      run.stdout === testCase.expectedOutput.replace(/\r\n/g, "\n").trim();

    results.push({
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput: run.stdout,
      passed,
      statusDescription: run.status,
      stderr: run.stderr
    });
  }

  const allPassed = results.every((r) => r.passed);

  return { passed: allPassed, results };
};
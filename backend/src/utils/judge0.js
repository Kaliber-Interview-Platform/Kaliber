import axios from "axios";

// common Judge0 language IDs you'll actually need for a DSA test
export const LANGUAGE_IDS = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50
};

const JUDGE0_URL = "https://judge0-ce.p.rapidapi.com/submissions";

// runs ONE piece of code against ONE input, returns raw Judge0 result.
// wait=true means Judge0 blocks and gives us the result directly -
// no need to poll a token repeatedly (simpler, fine for a college project's traffic).
const runOnce = async (sourceCode, languageId, stdin) => {
  const response = await axios.post(
    `${JUDGE0_URL}?base64_encoded=true&wait=true`,
    {
      source_code: Buffer.from(sourceCode).toString("base64"),
      language_id: languageId,
      stdin: Buffer.from(stdin || "").toString("base64")
    },
    {
      headers: {
        "content-type": "application/json",
        "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
      }
    }
  );

  const result = response.data;

  return {
    stdout: result.stdout ? Buffer.from(result.stdout, "base64").toString().trim() : "",
    stderr: result.stderr ? Buffer.from(result.stderr, "base64").toString().trim() : "",
    compileOutput: result.compile_output ? Buffer.from(result.compile_output, "base64").toString().trim() : "",
    statusId: result.status.id, // 3 = Accepted (ran fine); anything else = error/wrong/timeout
    statusDescription: result.status.description,
    time: result.time,
    memory: result.memory
  };
};

// runs one candidate's code against ALL of a question's test cases,
// returns whether it passed overall plus per-test-case detail
export const gradeSubmission = async (sourceCode, languageId, testCases) => {
  const results = [];

  for (const testCase of testCases) {
    const run = await runOnce(sourceCode, languageId, testCase.input);

    const passed = run.statusId === 3 && run.stdout === testCase.expectedOutput.trim();

    results.push({
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput: run.stdout,
      passed,
      statusDescription: run.statusDescription,
      stderr: run.stderr
    });
  }

  const allPassed = results.every((r) => r.passed);

  return { passed: allPassed, results };
};
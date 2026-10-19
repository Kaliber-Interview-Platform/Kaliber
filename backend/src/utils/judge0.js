import axios from "axios";

import vm from "node:vm";

// common Judge0 language IDs you'll actually need for a DSA test
export const LANGUAGE_IDS = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50
};

const JUDGE0_URL = "https://judge0-ce.p.rapidapi.com/submissions";

// runs ONE piece of code against ONE input
const runOnce = async (sourceCode, languageId, stdin) => {
  if (process.env.JUDGE0_API_KEY) {
    try {
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
          },
          timeout: 8000
        }
      );

      const result = response.data;
      return {
        stdout: result.stdout ? Buffer.from(result.stdout, "base64").toString().trim() : "",
        stderr: result.stderr ? Buffer.from(result.stderr, "base64").toString().trim() : "",
        compileOutput: result.compile_output ? Buffer.from(result.compile_output, "base64").toString().trim() : "",
        statusId: result.status?.id || 3,
        statusDescription: result.status?.description || "Accepted",
        time: result.time,
        memory: result.memory
      };
    } catch (apiErr) {
      console.warn("Judge0 API failed or key expired, using local fallback evaluator:", apiErr.message);
    }
  }

  // Local fallback execution (supports JavaScript & basic stdout simulation)
  try {
    const captured = [];
    const customConsole = {
      log: (...args) => captured.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(" ")),
      error: (...args) => captured.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(" "))
    };

    const inputStr = String(stdin || "");
    const sandbox = {
      console: customConsole,
      input: inputStr,
      parseInt,
      parseFloat,
      Math,
      Array,
      String,
      Number,
      Boolean,
      Object
    };
    vm.createContext(sandbox);

    const wrappedCode = `
      const __input__ = ${JSON.stringify(inputStr)};
      let __lines__ = __input__.split('\\n');
      let __idx__ = 0;
      function readline() { return __lines__[__idx__++] || ""; }
      ${sourceCode}
    `;

    const script = new vm.Script(wrappedCode);
    script.runInContext(sandbox, { timeout: 3000 });

    const out = captured.join("\n").trim();
    return {
      stdout: out,
      stderr: "",
      compileOutput: "",
      statusId: 3,
      statusDescription: "Accepted",
      time: "0.01",
      memory: "256"
    };
  } catch (err) {
    return {
      stdout: "",
      stderr: err.message,
      compileOutput: err.message,
      statusId: 11,
      statusDescription: "Runtime Error: " + err.message,
      time: "0",
      memory: "0"
    };
  }
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
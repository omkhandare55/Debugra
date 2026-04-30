const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'missing_key' });
const MODEL = 'llama-3.3-70b-versatile';

async function chatCompletion(systemPrompt, userPrompt) {
  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });
  return JSON.parse(response.choices[0].message.content);
}

async function chatCompletionText(systemPrompt, userPrompt) {
  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 2000,
  });
  return response.choices[0].message.content;
}

// 1. Error Explanation
async function explainError(code, error, language) {
  return chatCompletion(
    `You are a coding mentor. Analyze errors and explain them simply. Always respond in valid JSON.`,
    `The user wrote code in ${language} and got this error:

Code:
${code}

Error:
${error}

Respond in this EXACT JSON format:
{
  "issue": "one-line description of the exact problem",
  "explanation": "simple 2-3 sentence explanation a beginner would understand",
  "fix": "the specific code change needed",
  "bestPractice": "one tip to avoid this in future"
}`
  );
}

// 2. Code Fix
async function fixCodeAI(code, error, language) {
  let fixedCode = await chatCompletionText(
    `You are a code repair expert. Fix this code while keeping the user's logic intact. Return ONLY the corrected code. Do NOT wrap it in markdown. Do not say "Here is the code". CRITICAL: Do NOT output any <think> tags, do NOT explain your reasoning. Just output the raw code.`,
    `Fix this ${language} code:

${code}

Error (if any):
${error || 'No specific error, but optimize and fix any issues.'}`
  );

  // Strip reasoning tags robustly (even if unclosed)
  const thinkStart = fixedCode.indexOf('<think>');
  if (thinkStart !== -1) {
    const thinkEnd = fixedCode.indexOf('</think>');
    if (thinkEnd !== -1) {
      fixedCode = fixedCode.substring(0, thinkStart) + fixedCode.substring(thinkEnd + 8);
    } else {
      fixedCode = fixedCode.substring(0, thinkStart);
    }
  }

  // Strip markdown code fences and conversational text if the model still adds them
  if (fixedCode.includes('```')) {
    const match = fixedCode.match(/```[a-z]*\n([\s\S]*?)```/);
    if (match) {
      fixedCode = match[1];
    } else {
      fixedCode = fixedCode.replace(/```[a-z]*\n?/g, '').replace(/```/g, '');
    }
  }

  return { fixedCode: fixedCode.trim() };
}

// 3. Logic Explanation
async function explainLogicAI(code, language) {
  return chatCompletion(
    `You are a CS tutor. Explain code step-by-step. Always respond in valid JSON.`,
    `Explain this ${language} code step-by-step:

${code}

Respond in JSON:
{
  "steps": ["Step 1: ...", "Step 2: ..."],
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(1)",
  "summary": "one-line summary"
}`
  );
}

// 4. Test Case Generation
async function generateTestsAI(code, language) {
  return chatCompletion(
    `You are a QA engineer. Generate test cases. Always respond in valid JSON.`,
    `Generate test cases for this ${language} function:

${code}

Respond in JSON:
{
  "testCases": [
    { "input": "...", "expected": "...", "type": "normal" },
    { "input": "...", "expected": "...", "type": "normal" },
    { "input": "...", "expected": "...", "type": "edge" },
    { "input": "...", "expected": "...", "type": "edge" }
  ]
}`
  );
}

// 5. Execution Visualization
async function visualizeAI(code, language, input = '') {
  return chatCompletion(
    `You are a code tracer. Trace through code step by step showing variable states. Always respond in valid JSON.`,
    `Trace through this ${language} code step by step. Show variable states after each line.

${code}

${input ? `Input: ${input}` : ''}

Respond in JSON:
{
  "steps": [
    { "line": 1, "code": "x = 0", "variables": {"x": 0}, "explanation": "Initialize x" },
    { "line": 2, "code": "x += 1", "variables": {"x": 1}, "explanation": "Increment x" }
  ]
}`
  );
}

module.exports = { explainError, fixCodeAI, explainLogicAI, generateTestsAI, visualizeAI };

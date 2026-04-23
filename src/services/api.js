import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Execute code via Judge0
export const executeCode = async (sourceCode, languageId, stdin = '') => {
  const { data } = await api.post('/api/execute', {
    source_code: sourceCode,
    language_id: languageId,
    stdin,
  });
  return data;
};

// AI: Explain error
export const explainError = async (code, error, language) => {
  const { data } = await api.post('/api/ai/explain-error', { code, error, language });
  return data;
};

// AI: Fix code
export const fixCode = async (code, error, language) => {
  const { data } = await api.post('/api/ai/fix-code', { code, error, language });
  return data;
};

// AI: Explain logic
export const explainLogic = async (code, language) => {
  const { data } = await api.post('/api/ai/explain-logic', { code, language });
  return data;
};

// AI: Generate test cases
export const generateTestCases = async (code, language) => {
  const { data } = await api.post('/api/ai/generate-tests', { code, language });
  return data;
};

// AI: Visualize execution
export const visualizeExecution = async (code, language, input = '') => {
  const { data } = await api.post('/api/ai/visualize', { code, language, input });
  return data;
};

export default api;

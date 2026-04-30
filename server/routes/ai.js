const express = require('express');
const router = express.Router();
const NodeCache = require('node-cache');
const {
  explainError,
  fixCodeAI,
  explainLogicAI,
  generateTestsAI,
  visualizeAI,
} = require('../services/groqService');

// Initialize cache with 1 hour TTL to reduce redundant LLM calls
const aiCache = new NodeCache({ stdTTL: 3600 });

// Helper middleware to handle cached AI requests
const handleCachedRequest = (actionFn) => async (req, res, next) => {
  try {
    // Create a unique cache key based on route path and request body
    const cacheKey = `${req.path}_${JSON.stringify(req.body)}`;
    
    // Check if we have a cached response
    const cachedResponse = aiCache.get(cacheKey);
    if (cachedResponse) {
      console.log(`[Cache Hit] Serving cached AI response for ${req.path}`);
      return res.json(cachedResponse);
    }
    
    // Process request if not cached
    const result = await actionFn(req.body);
    
    // Cache the successful result
    aiCache.set(cacheKey, result);
    
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Error explanation
router.post('/explain-error', handleCachedRequest(async (body) => {
  const { code, error, language } = body;
  return await explainError(code, error, language);
}));

// Code fix
router.post('/fix-code', handleCachedRequest(async (body) => {
  const { code, error, language } = body;
  return await fixCodeAI(code, error, language);
}));

// Logic explanation
router.post('/explain-logic', handleCachedRequest(async (body) => {
  const { code, language } = body;
  return await explainLogicAI(code, language);
}));

// Test case generation
router.post('/generate-tests', handleCachedRequest(async (body) => {
  const { code, language } = body;
  return await generateTestsAI(code, language);
}));

// Execution visualization
router.post('/visualize', handleCachedRequest(async (body) => {
  const { code, language, input } = body;
  return await visualizeAI(code, language, input);
}));

module.exports = router;

const express = require('express');
const router = express.Router();
const NodeCache = require('node-cache');
const { executeCode } = require('../services/judge0Service');

// Initialize cache with 5 minutes TTL for code execution
const executeCache = new NodeCache({ stdTTL: 300 });

router.post('/', async (req, res, next) => {
  try {
    const { source_code, language_id, stdin } = req.body;

    if (!source_code || !language_id) {
      return res.status(400).json({ error: 'source_code and language_id are required' });
    }

    const cacheKey = `exec_${language_id}_${stdin || ''}_${source_code}`;
    const cachedResult = executeCache.get(cacheKey);
    
    if (cachedResult) {
      console.log('[Cache Hit] Serving cached execution result');
      return res.json(cachedResult);
    }

    const result = await executeCode(source_code, language_id, stdin || '');
    
    // Only cache successful requests
    if (result && result.status) {
      executeCache.set(cacheKey, result);
    }
    
    res.json(result);
  } catch (err) {
    console.error('Judge0 error:', err.response?.data || err.message);
    next(err);
  }
});

module.exports = router;

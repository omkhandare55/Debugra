const express = require('express');
const router = express.Router();
const { executeCode } = require('../services/judge0Service');

router.post('/', async (req, res, next) => {
  try {
    const { source_code, language_id, stdin } = req.body;

    if (!source_code || !language_id) {
      return res.status(400).json({ error: 'source_code and language_id are required' });
    }

    const result = await executeCode(source_code, language_id, stdin || '');
    res.json(result);
  } catch (err) {
    console.error('Judge0 error:', err.response?.data || err.message);
    next(err);
  }
});

module.exports = router;

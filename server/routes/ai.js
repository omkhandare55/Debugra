const express = require('express');
const router = express.Router();
const {
  explainError,
  fixCodeAI,
  explainLogicAI,
  generateTestsAI,
  visualizeAI,
} = require('../services/groqService');

// Error explanation
router.post('/explain-error', async (req, res, next) => {
  try {
    const { code, error, language } = req.body;
    const result = await explainError(code, error, language);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Code fix
router.post('/fix-code', async (req, res, next) => {
  try {
    const { code, error, language } = req.body;
    const result = await fixCodeAI(code, error, language);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Logic explanation
router.post('/explain-logic', async (req, res, next) => {
  try {
    const { code, language } = req.body;
    const result = await explainLogicAI(code, language);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Test case generation
router.post('/generate-tests', async (req, res, next) => {
  try {
    const { code, language } = req.body;
    const result = await generateTestsAI(code, language);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Execution visualization
router.post('/visualize', async (req, res, next) => {
  try {
    const { code, language, input } = req.body;
    const result = await visualizeAI(code, language, input);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

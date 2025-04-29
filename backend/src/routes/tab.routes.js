
const express = require('express');
const router = express.Router();
const { getAllTabs } = require('../controllers/tab.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// Protected route to get all tabs
router.get('/', authenticateToken, getAllTabs);

module.exports = router;

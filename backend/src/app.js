
const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth.routes');
const tabRoutes = require('./routes/tab.routes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/tabs', tabRoutes);

module.exports = app;

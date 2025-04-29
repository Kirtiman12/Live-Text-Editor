
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRY } = require('../config/jwt.config');

const login = (req, res) => {
  const { role, password } = req.body;
  
  // Validate role and password
  let isValid = false;
  
  if (role === 'User' && password === '123') {
    isValid = true;
  } else if (role === 'Admin' && password === '321') {
    isValid = true;
  } else if (role === 'Dummy' && password === '0') {
    isValid = true;
  }
  
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // Generate a unique user ID
  const userId = `${role}-${Date.now()}`;
  
  // Create JWT token
  const token = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  
  res.status(200).json({ token, userId, role });
};

module.exports = {
  login
};

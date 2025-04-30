const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRY } = require("../config/jwt.config");

// Track active users with their roles
const activeUsers = new Set();

const login = (req, res) => {
  const { role, password } = req.body;

  // Check if role is already logged in
  for (const user of activeUsers) {
    if (user.role === role) {
      return res.status(403).json({
        message: "User is already logged in",
      });
    }
  }

  // Check if 2 users are already active
  if (activeUsers.size >= 2) {
    return res.status(403).json({
      message: "Maximum users reached , Please try again later !",
    });
  }

  // Validate role and password
  let isValid = false;

  if (role === "User" && password === "123") {
    isValid = true;
  } else if (role === "Admin" && password === "321") {
    isValid = true;
  } else if (role === "Dummy" && password === "0") {
    isValid = true;
  }

  if (!isValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Generate a unique user ID
  const userId = `${role}-${Date.now()}`;

  // Add user to active users
  activeUsers.add({ userId, role });

  // Create JWT token
  const token = jwt.sign({ userId, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  });

  res.status(200).json({ token, userId, role });
};

// Remove user from active users
const removeActiveUser = (userId) => {
  for (const user of activeUsers) {
    if (user.userId === userId) {
      activeUsers.delete(user);
      break;
    }
  }
};

module.exports = {
  login,
  removeActiveUser,
};

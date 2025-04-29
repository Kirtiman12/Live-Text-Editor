
module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-should-be-in-env-file',
  JWT_EXPIRY: '24h'
};

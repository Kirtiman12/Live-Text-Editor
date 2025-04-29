
const http = require('http');
const app = require('./app');
const { initializeSocketServer } = require('./socket');
require('dotenv').config();

const server = http.createServer(app);

// Initialize Socket.IO server
initializeSocketServer(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

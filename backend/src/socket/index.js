
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt.config');
const { tabContents, setTabContent, deleteTabContent } = require('../services/tab.service');

// Store active tabs and their users
const activeTabs = new Map();

const initializeSocketServer = (server) => {
  // Set up Socket.IO server
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Socket.IO authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication required'));
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return next(new Error('Invalid or expired token'));
      }
      socket.user = user;
      socket.userId = socket.handshake.auth.userId;
      socket.role = socket.handshake.auth.role;
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.role})`);
    
    // Join a tab
    socket.on('joinTab', ({ tabId, userId }) => {
      // Check if tab exists in the map
      if (!activeTabs.has(tabId)) {
        activeTabs.set(tabId, new Set());
        setTabContent(tabId, ''); // Initialize with empty content
      }
      
      const tabUsers = activeTabs.get(tabId);
      
      // Check if the tab already has 2 users
      if (tabUsers.size >= 2 && !tabUsers.has(userId)) {
        socket.emit('error', { message: 'Maximum collaborators reached! Please try again.' });
        return;
      }
      
      // Add user to tab
      tabUsers.add(userId);
      socket.join(tabId);
      
      console.log(`User ${userId} joined tab ${tabId}`);
      console.log(`Tab ${tabId} has ${tabUsers.size} users`);
      
      // Send current content to the user
      socket.emit('tabContentUpdate', { 
        tabId, 
        content: tabContents.get(tabId) || ''
      });

      // Broadcast collaborator list update to all users in the tab
      io.to(tabId).emit('collaboratorsUpdate', {
        tabId,
        users: Array.from(tabUsers)
      });
    });
    
    // Leave a tab
    socket.on('leaveTab', ({ tabId, userId }) => {
      if (activeTabs.has(tabId)) {
        const tabUsers = activeTabs.get(tabId);
        tabUsers.delete(userId);
        
        console.log(`User ${userId} left tab ${tabId}`);
        console.log(`Tab ${tabId} has ${tabUsers.size} users`);
        
        // Broadcast updated collaborator list
        io.to(tabId).emit('collaboratorsUpdate', {
          tabId,
          users: Array.from(tabUsers)
        });
        
        // Remove tab if no users left
        if (tabUsers.size === 0) {
          activeTabs.delete(tabId);
          deleteTabContent(tabId);
          console.log(`Tab ${tabId} removed`);
        }
      }
      
      socket.leave(tabId);
    });
    
    // Update tab content
    socket.on('updateTabContent', ({ tabId, content }) => {
      if (!activeTabs.has(tabId)) {
        socket.emit('error', { message: 'Tab does not exist' });
        return;
      }
      
      const tabUsers = activeTabs.get(tabId);
      
      if (!tabUsers.has(socket.userId)) {
        socket.emit('error', { message: 'You are not in this tab' });
        return;
      }
      
      // Update content
      setTabContent(tabId, content);
      
      // Broadcast to all users in the tab except the sender
      socket.to(tabId).emit('tabContentUpdate', { tabId, content });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      
      // Remove user from all tabs
      activeTabs.forEach((users, tabId) => {
        if (users.has(socket.userId)) {
          users.delete(socket.userId);
          console.log(`User ${socket.userId} removed from tab ${tabId}`);
          
          // Broadcast updated collaborator list
          io.to(tabId).emit('collaboratorsUpdate', {
            tabId,
            users: Array.from(users)
          });
          
          // Remove tab if no users left
          if (users.size === 0) {
            activeTabs.delete(tabId);
            deleteTabContent(tabId);
            console.log(`Tab ${tabId} removed`);
          }
        }
      });
    });
  });

  return io;
};

module.exports = { initializeSocketServer };

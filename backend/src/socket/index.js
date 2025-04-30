const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/jwt.config");
const {
  tabContents,
  setTabContent,
  deleteTabContent,
} = require("../services/tab.service");
const { removeActiveUser } = require("../controllers/auth.controller");

const activeTabs = new Map();

const initializeSocketServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return next(new Error("Invalid or expired token"));
      }
      socket.user = user;
      socket.userId = socket.handshake.auth.userId;
      socket.role = socket.handshake.auth.role;
      next();
    });
  });

  const broadcastOpenTabs = () => {
    const tabs = Array.from(activeTabs.entries()).map(
      ([tabId, { users, name }]) => ({
        tabId,
        users: Array.from(users),
        name,
      })
    );
    console.log("Broadcasting open tabs:", tabs);
    io.emit("openTabsUpdate", { tabs });
  };

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.role})`);
    broadcastOpenTabs();

    socket.on("joinTab", ({ tabId, userId, name }) => {
      if (userId !== socket.userId) {
        console.warn(
          `User ID mismatch in joinTab: sent ${userId}, expected ${socket.userId}`
        );
        socket.emit("error", { message: "Invalid user ID" });
        return;
      }
      if (!activeTabs.has(tabId)) {
        activeTabs.set(tabId, {
          users: new Set(),
          name: name || `Tab ${tabId}`,
        });
        setTabContent(tabId, "");
        console.log(
          `Created new tab: ${tabId} with name: ${name || `Tab ${tabId}`}`
        );
      }
      const tabData = activeTabs.get(tabId);
      tabData.users.add(socket.userId);
      socket.join(tabId);
      console.log(`User ${socket.userId} joined tab ${tabId}`);
      console.log(`Tab ${tabId} has ${tabData.users.size} users`);
      io.to(tabId).emit("tabContentUpdate", {
        tabId,
        content: tabContents.get(tabId) || "",
      });
      io.to(tabId).emit("collaboratorsUpdate", {
        tabId,
        users: Array.from(tabData.users),
      });
      broadcastOpenTabs();
    });

    socket.on("renameTab", ({ tabId, name, userId }) => {
      if (userId !== socket.userId) {
        console.warn(
          `User ID mismatch in renameTab: sent ${userId}, expected ${socket.userId}`
        );
        socket.emit("error", { message: "Invalid user ID" });
        return;
      }
      if (!activeTabs.has(tabId)) {
        socket.emit("error", { message: "Tab does not exist" });
        return;
      }
      const tabData = activeTabs.get(tabId);
      if (!tabData.users.has(socket.userId)) {
        console.warn(
          `User ${socket.userId} not in tab ${tabId}:`,
          Array.from(tabData.users)
        );
        socket.emit("error", { message: "You are not in this tab" });
        return;
      }
      const finalName = name.trim() || `Tab ${tabId}`;
      if (tabData.name !== finalName) {
        tabData.name = finalName;
        console.log(`Renamed tab ${tabId} to ${finalName}`);
        broadcastOpenTabs();
      }
    });

    socket.on("leaveTab", ({ tabId, userId }) => {
      if (userId !== socket.userId) {
        console.warn(
          `User ID mismatch in leaveTab: sent ${userId}, expected ${socket.userId}`
        );
        socket.emit("error", { message: "Invalid user ID" });
        return;
      }
      if (activeTabs.has(tabId)) {
        const tabData = activeTabs.get(tabId);
        tabData.users.delete(socket.userId);
        console.log(`User ${socket.userId} left tab ${tabId}`);
        console.log(`Tab ${tabId} has ${tabData.users.size} users`);
        io.to(tabId).emit("collaboratorsUpdate", {
          tabId,
          users: Array.from(tabData.users),
        });
        broadcastOpenTabs();
      }
      socket.leave(tabId);
    });

    socket.on("closeTab", ({ tabId, userId }) => {
      if (userId !== socket.userId) {
        console.warn(
          `User ID mismatch in closeTab: sent ${userId}, expected ${socket.userId}`
        );
        socket.emit("error", { message: "Invalid user ID" });
        return;
      }
      if (activeTabs.has(tabId)) {
        const tabData = activeTabs.get(tabId);
        tabData.users.delete(socket.userId);
        activeTabs.delete(tabId);
        deleteTabContent(tabId);
        console.log(`Tab ${tabId} closed by ${socket.userId}`);
        io.to(tabId).emit("collaboratorsUpdate", {
          tabId,
          users: Array.from(tabData.users),
        });
        broadcastOpenTabs();
      }
      socket.leave(tabId);
    });

    socket.on("updateTabContent", ({ tabId, content }) => {
      if (!activeTabs.has(tabId)) {
        socket.emit("error", { message: "Tab does not exist" });
        return;
      }
      const tabData = activeTabs.get(tabId);
      if (!tabData.users.has(socket.userId)) {
        console.warn(
          `User ${socket.userId} not in tab ${tabId}:`,
          Array.from(tabData.users)
        );
        socket.emit("error", { message: "You are not in this tab" });
        return;
      }
      setTabContent(tabId, content);
      console.log(`Updated content for tab ${tabId}:`, content);
      socket.to(tabId).emit("tabContentUpdate", { tabId, content });
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);
      if (socket.userId) {
        removeActiveUser(socket.userId);
        console.log(`Removed user ${socket.userId} from active users`);
      }
      activeTabs.forEach((tabData, tabId) => {
        if (tabData.users.has(socket.userId)) {
          tabData.users.delete(socket.userId);
          console.log(`User ${socket.userId} removed from tab ${tabId}`);
          io.to(tabId).emit("collaboratorsUpdate", {
            tabId,
            users: Array.from(tabData.users),
          });
          broadcastOpenTabs();
        }
      });
    });
  });

  return io;
};

module.exports = { initializeSocketServer };

# Live Text Editor

A collaborative real-time text editor with a VSCode-inspired interface. This project allows multiple users to edit text simultaneously within the same tabs, with authentication and role-based access.

## Features

- **User Authentication**: Login with role-based access (User, Admin, Dummy)
- **Real-time Collaboration**: Two users can edit text simultaneously in the same tab
- **Tab Management**: Create, delete, and switch between tabs
- **Draggable and Resizable Tabs**: Similar to VS Code's interface as well as put names to the tabs
- **JWT Authentication**: Secure API endpoints and WebSockets
- **Session Management**: Maintaining user sessions without database persistence
- **Modern UI**: Dark theme inspired by code editors

## Tech Stack

### Frontend

- React with Vite
- Tailwind CSS for styling
- Socket.IO client for real-time communication
- React Router for navigation
- ShadCN UI components
  -Universe IO components and Aceternity UI

### Backend

- Node.js with Express
- Socket.IO for WebSockets
- JWT for authentication
- In-memory storage (no database required)

## Running the Project

### Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Start the server
npm run dev
```

### Frontend Setup

```bash
# Install dependencies in the root directory
npm install

# Start the development server
npm run dev
```

## Usage

1. Open the application in your browser (typically at http://localhost:8080)
2. Login with one of the following credentials:
   - Role: User, Password: 123
   - Role: Admin, Password: 321
   - Role: Dummy, Password: 0
3. Create tabs and start editing
4. Open another browser window/incognito mode and log in as another user to test the collaboration feature

## Project Structure

```
├── src/
│   ├── components/            # React components
│   ├── pages/                 # Page components
│   ├── App.tsx                # Main application component
│   └── main.tsx               # Entry point
├── backend/
│   ├── server.js              # Express server and Socket.IO setup
│   └── package.json           # Backend dependencies
└── package.json               # Frontend dependencies
```

## Notes

- Maximum of 2 users can collaborate on a single tab at the same time
- Session data is stored in memory and is not persisted
- JWT authentication is used for both REST API and WebSocket connections

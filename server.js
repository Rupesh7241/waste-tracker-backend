// backend/server.js

const express    = require('express');
const dotenv     = require('dotenv');
const cors       = require('cors');
const http       = require('http');          // ← NEW
const { Server } = require('socket.io');     // ← NEW
const connectDB  = require('./config/db');

dotenv.config();
connectDB();

const app    = express();
const server = http.createServer(app);       // ← wrap express in http server

// ── Socket.io setup ──────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:4173',
      'https://waste-tracker-frontend.vercel.app',    
    process.env.FRONTEND_URL,
             ],         // your React dev URL
    methods: ['GET', 'POST'],
  },
});

// Store io on app so controllers can access it via req.app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Client tells us which room to join after login
  // User joins their private room, admin joins admin-room
  socket.on('join-room', (roomName) => {
    socket.join(roomName);
    console.log(`📦 Socket ${socket.id} joined room: ${roomName}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// ── Middleware ────────────────────────────────────────────────────────────
app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://waste-tracker-frontend.vercel.app',      
    process.env.FRONTEND_URL,
  ],
  credentials: true,
}));

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/admin',     require('./routes/adminRoutes'));
app.use('/api/schedules', require('./routes/scheduleRoutes'));

app.get('/', (req, res) => {
  res.json({ message: '🌿 Waste Management API is running!' });
});

// ── Error handlers ────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// ── Start server (use server.listen NOT app.listen) ───────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {        // ← important: server.listen not app.listen
  console.log(`🚀 Server + Socket.io running on port ${PORT}`);
});
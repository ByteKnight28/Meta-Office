import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import type { ClientToServerEvents, ServerToClientEvents, UserState } from './types';

export * from './types';

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

// Basic Health Check Endpoint
app.get('/health', (_, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Bind Express to the standard HTTP server
const httpServer = createServer(app);

// Initialize Socket.io with strict types and CORS permissions
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket']
});

const globalState: Record<string, UserState> = {};

io.on('connection', (socket) => {
  console.log(`[Connect] Client connected: ${socket.id}`);

  // EVENT: User Joins a Specific Map Room
  socket.on('join_room', ({ room, peerId, x, y }) => {
    // Leave previous rooms if any
    const currentRooms = Array.from(socket.rooms).filter(r => r !== socket.id);
    currentRooms.forEach(r => socket.leave(r));

    socket.join(room);

    // 1. Construct the user object explicitly in a local variable
    const newUser: UserState = {
      id: socket.id,
      peerId: peerId || undefined,
      x: x ?? 150,
      y: y ?? 200,
      room: room,
      isSitting: false,
      direction: 'south'
    };

    globalState[socket.id] = newUser;

    console.log(`[Room Join] Socket ${socket.id} joined room '${room}' (PeerID: ${peerId || 'None'})`);

    socket.to(room).emit('user_joined', newUser);
  });

  // EVENT: User Movement Update
  socket.on('move', ({ x, y, direction }) => {
    const user = globalState[socket.id];
    if (user) {
      user.x = x;
      user.y = y;
      if (direction) user.direction = direction;
      user.isSitting = false;
    }
  });

  // EVENT: Toggle Sitting State
  socket.on('toggle_sit', ({ isSitting, x, y }) => {
    const user = globalState[socket.id];
    if (user) {
      user.isSitting = isSitting;
      if (x !== undefined) user.x = x;
      if (y !== undefined) user.y = y;
    }
  });

  // EVENT: Register/Update WebRTC Peer ID
  socket.on('register_peer', (peerId) => {
    const user = globalState[socket.id];
    if (user) {
      user.peerId = peerId;
      console.log(`[Peer Registered] Socket ${socket.id} assigned PeerID: ${peerId}`);
    }
  });

  // EVENT: Disconnect & Cleanup
  socket.on('disconnect', (reason) => {
    console.log(`[Disconnect] Client ${socket.id} left due to: ${reason}`);

    const user = globalState[socket.id];
    if (user) {
      const userRoom = user.room;
      delete globalState[socket.id];
      
      io.to(userRoom).emit('user_left', socket.id);
    }
  });
});

const TICK_RATE_MS = 50;

setInterval(() => {
  // Step A: Bucket active users by room to enforce data isolation
  const roomBuckets: Record<string, Record<string, UserState>> = {};

  for (const [socketId, userState] of Object.entries(globalState)) {
    const room = userState.room;
    if (!roomBuckets[room]) {
      roomBuckets[room] = {};
    }
    roomBuckets[room][socketId] = userState;
  }

  // Step B: Broadcast consolidated state ONLY to users in that specific room
  for (const [roomName, roomUsers] of Object.entries(roomBuckets)) {
    io.to(roomName).emit('state_update', roomUsers);
  }
}, TICK_RATE_MS);

const PORT = Number(process.env.PORT) || 8080;
const HOST = '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
  console.log(`=================================================`);
  console.log(`🚀 Virtual Office Backend Running on http://${HOST}:${PORT}`);
  console.log(`⚡ Transport: WebSocket Only`);
  console.log(`⏱️  Spatial Tick Rate: 20 Ticks/sec (50ms)`);
  console.log(`=================================================`);
});
import { Server } from 'socket.io';

let io;

function buildSocketCorsOrigin() {
  const list = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:5174',
  ].filter(Boolean);
  const origins = [...new Set(list)];
  if (origins.length === 0) return true;
  if (origins.length === 1) return origins[0];
  return origins;
}

export function initSocket(server) {
  // Initialize the Socket.io server and attach it to our HTTP server.
  // CORS must include local Vite dev origins (same as Express), not only CLIENT_URL.
  io = new Server(server, {
    cors: {
      origin: buildSocketCorsOrigin(),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('User connected to Socket.io:', socket.id);

    // When a user opens a Poll Results page, they will "join" a room 
    // named after that specific poll. This ensures they only get 
    // updates for the poll they are looking at.
    socket.on('join_poll', (pollId) => {
      if (!pollId || typeof pollId !== 'string') return;
      socket.join(`poll_${pollId}`);
      console.log(`Socket ${socket.id} joined room: poll_${pollId}`);
    });

    socket.on('leave_poll', (pollId) => {
      if (!pollId || typeof pollId !== 'string') return;
      socket.leave(`poll_${pollId}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected from Socket.io');
    });
  });

  return io;
}

// Export a function to get the 'io' instance so we can use it inside our API routes.
export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}

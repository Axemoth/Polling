import { Server } from 'socket.io';

let io;

export function initSocket(server) {
  // Initialize the Socket.io server and attach it to our HTTP server.
  // We enable CORS so our React frontend can connect.
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected to Socket.io:', socket.id);

    // When a user opens a Poll Results page, they will "join" a room 
    // named after that specific poll. This ensures they only get 
    // updates for the poll they are looking at.
    socket.on('join_poll', (pollId) => {
      socket.join(`poll_${pollId}`);
      console.log(`Socket ${socket.id} joined room: poll_${pollId}`);
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

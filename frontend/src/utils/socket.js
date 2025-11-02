import { io } from 'socket.io-client';

let socket = null;

export function createSocket(token) {
  if (socket) return socket;

  const auth = token ? { token } : {};
  socket = io(import.meta.env.VITE_API_URL || 
    (import.meta.env.MODE === 'production' 
      ? 'https://quiz-go-mantra-backend.vercel.app' 
      : 'http://localhost:3000'), {
    path: '/socket.io',
    transports: ['websocket'],
    auth,
  });

  socket.on('connect', () => {
    // console.log('Socket connected', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('Socket connect_error', err && err.message ? err.message : err);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

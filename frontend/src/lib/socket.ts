import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../types/socket';

const URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080';

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(URL, {
  transports: ['websocket'],
  autoConnect: true,
});

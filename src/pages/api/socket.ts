import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Socket as NetSocket } from 'net';
import type { Server as IOServer } from 'socket.io';

interface SocketServer extends HTTPServer {
  io?: IOServer | undefined;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

const users = new Map<string, string>();

const SocketHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const io = new SocketIOServer(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', socket => {
      console.log('A user connected:', socket.id);

      const existingUser = Array.from(users.entries()).find(([_, name]) => name === socket.handshake.query.userName);
      if (existingUser) {
        users.delete(existingUser[0]);
        users.set(socket.id, existingUser[1]);
        io.emit('userReconnected', { oldId: existingUser[0], newId: socket.id, userName: existingUser[1] });
      }

      socket.on('setUsername', (userName: string) => {
        if (Array.from(users.values()).includes(userName)) {
          socket.emit('usernameTaken');
          return;
        }
        users.set(socket.id, userName);
        io.emit('userJoined', { id: socket.id, userName });
        console.log(`User ${userName} joined with ID ${socket.id}`);

        const userList = Array.from(users.entries()).map(([id, name]) => ({ id, userName: name }));
        io.emit('updateUserList', userList);
      });

      socket.on('disconnect', () => {
        const userName = users.get(socket.id);
        if (userName) {
          console.log(`User ${userName} disconnected`);
          io.emit('userLeft', { id: socket.id, userName });
          users.delete(socket.id);

          const userList = Array.from(users.entries()).map(([id, name]) => ({ id, userName: name }));
          io.emit('updateUserList', userList);
        }
      });

      socket.on('send-notification', (toSocketId: string) => {
        const fromUserName = users.get(socket.id);
        if (fromUserName && users.has(toSocketId)) {
          io.to(toSocketId).emit('notification', `You've been pinged by ${fromUserName}`);
          console.log(`Notification sent from ${fromUserName} to ${toSocketId}`);
        }
      });

      const userList = Array.from(users.entries()).map(([id, name]) => ({ id, userName: name }));
      socket.emit('updateUserList', userList);
    });
  }
  res.end();
};

export default SocketHandler;
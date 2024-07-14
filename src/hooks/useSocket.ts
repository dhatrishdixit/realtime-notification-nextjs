import { useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';

let socket: Socket | undefined;

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<{ id: string, userName: string }[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    socketInitializer();
    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  async function socketInitializer() {
    await fetch('/api/socket');
    socket = io();

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setConnectedUsers([]);
    });

    socket.on('userLeft', (userInfo) => {
      console.log('User left:', userInfo);
      setNotifications(prev => [...prev, `${userInfo.userName} has left`]);
    });

    socket.on('userJoined', (userInfo) => {
      console.log('User joined:', userInfo);
      setNotifications(prev => [...prev, `${userInfo.userName} has joined`]);
    });

    socket.on('updateUserList', (users) => {
      console.log('Updated user list:', users);
      setConnectedUsers(users);
    });

    socket.on('notification', (message) => {
      setNotifications(prev => [...prev, message]);
    });
  }

  const setUserName = (userName: string) => {
    console.log("set username called");
    if (socket) socket.emit('setUsername', userName);
  };

  const sendNotification = (toSocketId: string) => {
    if (socket) socket.emit('send-notification', toSocketId);
  };

  return { isConnected, sendNotification, socket, setUserName, connectedUsers, notifications };
};

import { useState, useEffect, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

let socket: Socket | undefined;

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<{ id: string, userName: string }[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [usernameTaken, setUsernameTaken] = useState(false);

  const socketInitializer = useCallback(async () => {
    await fetch('/api/socket');
    socket = io({
      query: { userName: localStorage.getItem('userName') || '' }
    });

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('userLeft', (userInfo) => {
      console.log('User left:', userInfo);
      setNotifications(prev => [...prev, `${userInfo.userName} has left`]);
      setConnectedUsers(prev => prev.filter(user => user.id !== userInfo.id));
    });

    socket.on('userJoined', (userInfo) => {
      console.log('User joined:', userInfo);
      setNotifications(prev => [...prev, `${userInfo.userName} has joined`]);
      setConnectedUsers(prev => [...prev, userInfo]);
    });

    socket.on('userReconnected', (userInfo) => {
      console.log('User reconnected:', userInfo);
      setConnectedUsers(prev => prev.map(user => 
        user.id === userInfo.oldId ? { ...user, id: userInfo.newId } : user
      ));
    });

    socket.on('updateUserList', (users) => {
      console.log('Updated user list:', users);
      setConnectedUsers(users);
    });

    socket.on('notification', (message) => {
      setNotifications(prev => [...prev, message]);
    });

    socket.on('usernameTaken', () => {
      setUsernameTaken(true);
    });
  }, []);

  useEffect(() => {
    socketInitializer();
    return () => {
      if (socket) socket.disconnect();
    };
  }, [socketInitializer]);

  const setUserName = (userName: string) => {
    console.log("set username called");
    if (socket) {
      socket.emit('setUsername', userName);
      localStorage.setItem('userName', userName);
    }
  };

  const sendNotification = (toSocketId: string) => {
    if (socket) socket.emit('send-notification', toSocketId);
  };

  return { isConnected, sendNotification, socket, setUserName, connectedUsers, notifications, usernameTaken };
};
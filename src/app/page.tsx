'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function Home() {
  const { isConnected, sendNotification, socket, setUserName, connectedUsers, notifications } = useSocket();
  const { isLoaded, isSignedIn, user } = useUser();
  console.log(connectedUsers);
  useEffect(() => {
    if (isLoaded && isSignedIn && user?.username) {
      setUserName(user.username);
    }
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    if (notifications.length > 0) {
      toast(notifications[notifications.length - 1]);
    }
  }, [notifications,socket]);

  if (!isLoaded || !isSignedIn) {
    return <div>Please sign in to use the chat.</div>;
  }

  return (
    <div className="h-screen w-screen p-8 dark:bg-gray-900">
      <h1 className="text-2xl font-bold mb-4">Real-Time Ping Notification System</h1>
      <p className="mb-4">Connection status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <div className="grid grid-cols-1 overflow-y-auto md:grid-cols-2 lg:grid-cols-3 gap-4">
        {connectedUsers.filter(connectedUser => connectedUser.userName !== user.username).map((connectedUser) => (
          <Card key={connectedUser.id}>
            <CardHeader>
              <CardTitle>{connectedUser.userName}</CardTitle>
              <CardDescription>User ID: {connectedUser.id}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => sendNotification(connectedUser.id)}>Ping User</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

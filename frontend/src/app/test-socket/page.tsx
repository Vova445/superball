'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/useAuthStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export default function SocketTestPage() {
  const { accessToken, user } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [inRoom, setInRoom] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    console.log('Attempting to connect to socket at', SOCKET_URL, 'with token:', accessToken?.substring(0, 10) + '...');
    const newSocket = io(SOCKET_URL, {
      auth: { token: accessToken },
      // let it try polling first if websocket fails
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setMessages((prev) => [...prev, 'Connected to Socket.IO']);
    });

    newSocket.on('user_joined', (data) => {
      console.log('User joined', data);
      setMessages((prev) => [...prev, `User joined: ${data.user_id} (SID: ${data.sid})`]);
    });

    newSocket.on('user_left', (data) => {
      setMessages((prev) => [...prev, `User left: ${data.user_id}`]);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setMessages((prev) => [...prev, `Connection error: ${err.message}`]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [accessToken]);

  const joinRoom = () => {
    if (socket) {
      socket.emit('join_room', { room: 'test-room' });
      setInRoom(true);
      setMessages((prev) => [...prev, 'Joined test-room']);
    }
  };

  const leaveRoom = () => {
    if (socket) {
      socket.emit('leave_room', { room: 'test-room' });
      setInRoom(false);
      setMessages((prev) => [...prev, 'Left test-room']);
    }
  };

  if (!accessToken) return <div className="p-10 text-white">Please login first</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-10">
      <h1 className="text-3xl font-bold mb-6">Socket.IO Room Test</h1>
      <div className="flex gap-4 mb-8">
        {!inRoom ? (
          <button onClick={joinRoom} className="bg-blue-600 px-6 py-2 rounded-lg hover:bg-blue-500">Join Test Room</button>
        ) : (
          <button onClick={leaveRoom} className="bg-red-600 px-6 py-2 rounded-lg hover:bg-red-500">Leave Test Room</button>
        )}
      </div>
      
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-96 overflow-y-auto">
        <h3 className="text-xl mb-4 font-semibold text-gray-400">Events Log:</h3>
        <ul className="space-y-2">
          {messages.map((msg, i) => (
            <li key={i} className="font-mono text-sm border-l-2 border-blue-500 pl-3 py-1 bg-gray-700/30">
              {msg}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

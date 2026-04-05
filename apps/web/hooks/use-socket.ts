'use client';

import { useEffect, useState, useRef } from 'react';
import { getSocket, disconnectSocket } from '@/lib/socket-client';
import type { Socket } from 'socket.io-client';

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    try {
      const socket = getSocket();
      socketRef.current = socket;
      setConnected(socket.connected);

      const onConnect = () => setConnected(true);
      const onDisconnect = () => setConnected(false);

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);

      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
      };
    } catch {
      setConnected(false);
    }
  }, []);

  const emit = (event: string, data: any) => {
    socketRef.current?.emit(event, data);
  };

  const on = (event: string, callback: (...args: any[]) => void) => {
    socketRef.current?.on(event, callback);
  };

  const off = (event: string, callback?: (...args: any[]) => void) => {
    socketRef.current?.off(event, callback);
  };

  return { socket: socketRef.current, connected, emit, on, off };
}

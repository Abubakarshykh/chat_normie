'use client';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useWorldStore } from '@/store/useWorldStore';

const BASE_URL = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001').replace(/\/$/, '');

let socket: Socket | null = null;

export function useSocket() {
  const { setConnected, prependFeedEvent, setDramaAlert, updateNormieMood } = useWorldStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    socket = io(BASE_URL, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      console.log('[Socket] Connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setConnected(false);
    });

    socket.on('feed-update', (event) => {
      prependFeedEvent(event);
    });

    socket.on('drama-alert', (event) => {
      setDramaAlert(event);
      setTimeout(() => setDramaAlert(null), 6000);
    });

    socket.on('normie-update', (data: { id: string; mood?: string }) => {
      if (data.mood) updateNormieMood(data.id, data.mood);
    });

    return () => {
      socket?.disconnect();
      initialized.current = false;
    };
  }, []);

  return socket;
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/hooks/use-socket';
import { PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
}

interface ChatWindowProps {
  conversationId: string;
  participantName: string;
  onClose: () => void;
}

export function ChatWindow({ conversationId, participantName, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket, connected, on, off, emit } = useSocket();

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    fetch(`${API}/chat/conversations/${conversationId}/messages`, { credentials: 'include' })
      .then((r) => r.json())
      .then((res) => setMessages(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => {
    const handleNewMessage = (msg: Message) => {
      if (msg.id && !messages.find((m) => m.id === msg.id)) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    on(`chat:${conversationId}`, handleNewMessage);
    return () => { off(`chat:${conversationId}`, handleNewMessage); };
  }, [conversationId, on, off, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
      const res = await fetch(`${API}/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ body: newMessage }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setMessages((prev) => [...prev, created.data ?? created]);
      setNewMessage('');
      emit('chat:message', { conversationId, body: newMessage });
    } catch {}
    finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 sm:w-96 bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden z-50 flex flex-col" style={{ height: '480px' }}>
      {/* Header */}
      <div className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">{participantName[0]}</div>
          <div>
            <p className="text-sm font-semibold">{participantName}</p>
            <p className="text-xs text-indigo-200">{connected ? 'En línea' : 'Desconectado'}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white"><XMarkIcon className="h-5 w-5" /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className={`h-10 rounded-xl animate-pulse ${i % 2 === 0 ? 'bg-zinc-100 ml-8' : 'bg-indigo-100 mr-8'}`} />)}</div>
        ) : messages.length === 0 ? (
          <p className="text-center text-zinc-400 text-sm py-8">No hay mensajes aún</p>
        ) : (
          messages.map((m) => {
            const isMine = m.senderName === 'me';
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isMine ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-zinc-100 text-zinc-800 rounded-bl-sm'}`}>
                  <p>{m.body}</p>
                  <p className={`text-xs mt-1 ${isMine ? 'text-indigo-200' : 'text-zinc-400'}`}>{new Date(m.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-200 p-3 flex gap-2 shrink-0">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !sending && sendMessage()}
          placeholder="Escribe un mensaje..."
          className="flex-1 border border-zinc-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

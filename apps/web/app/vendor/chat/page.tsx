'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Conversation {
  id: string;
  customerName: string;
  customerAvatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  orderId?: string;
}

export default function VendorChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch(`${API}/chat/conversations?mine=true`, { credentials: 'include' })
      .then((r) => r.json())
      .then((res) => setConversations(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openConversation = async (conv: Conversation) => {
    setSelected(conv);
    try {
      const res = await fetch(`${API}/chat/conversations/${conv.id}/messages`, { credentials: 'include' });
      const data = await res.json();
      setMessages(data.data ?? []);
    } catch {}
  };

  const sendMessage = async () => {
    if (!selected || !newMessage.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/chat/conversations/${selected.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ body: newMessage }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setMessages((m) => [...m, created.data ?? created]);
      setNewMessage('');
    } catch {}
    finally {
      setSending(false);
    }
  };

  const filtered = conversations.filter((c) =>
    c.customerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Mensajes</h1>
        <p className="text-sm text-zinc-500 mt-1">Chatea con tus clientes.</p>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden" style={{ minHeight: '600px' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 h-full">
          {/* Conversations list */}
          <div className="border-r border-zinc-200">
            <div className="p-3">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            {loading ? (
              <div className="p-3 space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-zinc-100 rounded-lg animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-zinc-400 text-sm py-10">No hay conversaciones</p>
            ) : (
              <div className="divide-y divide-zinc-100">
                {filtered.map((c) => (
                  <button key={c.id} onClick={() => openConversation(c)} className={`w-full text-left px-4 py-3 hover:bg-zinc-50 transition ${selected?.id === c.id ? 'bg-indigo-50' : ''}`}>
                    <div className="flex items-center gap-3">
                      {c.customerAvatar ? (
                        <img src={c.customerAvatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">{c.customerName[0]}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">{c.customerName}</span>
                          {c.unreadCount > 0 && <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{c.unreadCount}</span>}
                        </div>
                        <p className="text-xs text-zinc-400 truncate">{c.lastMessage}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chat area */}
          <div className="col-span-2 flex flex-col">
            {selected ? (
              <>
                <div className="px-6 py-4 border-b border-zinc-200">
                  <h3 className="font-semibold">{selected.customerName}</h3>
                  {selected.orderId && <p className="text-xs text-zinc-400">Orden: {selected.orderId.slice(0, 8)}</p>}
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                  {messages.map((m: any) => (
                    <div key={m.id} className={`flex ${m.senderRole === 'seller' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-2 text-sm ${m.senderRole === 'seller' ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-800'}`}>
                        <p>{m.body}</p>
                        <p className={`text-xs mt-1 ${m.senderRole === 'seller' ? 'text-indigo-200' : 'text-zinc-400'}`}>{new Date(m.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-6 py-4 border-t border-zinc-200 flex gap-2">
                  <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !sending && sendMessage()} placeholder="Escribe un mensaje..." className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">Enviar</button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-400">
                <p className="text-sm">Selecciona una conversación</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

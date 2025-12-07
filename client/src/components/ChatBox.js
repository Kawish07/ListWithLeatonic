import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io();

const ChatBox = ({ propertyId, userId }) => {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');

  useEffect(() => {
    socket.on('message', msg => {
      setMessages(prev => [...prev, msg]);
    });
    return () => {
      socket.off('message');
    };
  }, []);

  const sendMessage = () => {
    if (!content) return;
    const msg = { property: propertyId, from: userId, content };
    socket.emit('message', msg);
    setMessages(prev => [...prev, msg]);
    setContent('');
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-subtle">
      <div className="mb-2 font-bold text-accent">Chat</div>
      <div className="h-40 overflow-y-auto mb-2 border rounded p-2 bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className={msg.from === userId ? 'text-right' : 'text-left'}>
            <span className="inline-block px-2 py-1 rounded bg-accent text-white mb-1">{msg.content}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={content} onChange={e => setContent(e.target.value)} className="flex-1 p-2 border rounded" placeholder="Type a message..." />
        <button onClick={sendMessage} className="bg-accent text-white px-4 py-2 rounded-xl font-bold">Send</button>
      </div>
    </div>
  );
};

export default ChatBox;

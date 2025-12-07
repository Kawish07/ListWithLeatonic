import React from 'react';
import useToastStore from '../store/toastStore';

const Toast = ({ t, onClose }) => {
  const color = t.type === 'success' ? 'bg-green-500' : t.type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  return (
    <div className={`max-w-sm w-full ${color} text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-4`}>
      <div className="flex-1 text-sm">{t.message}</div>
      <button onClick={() => onClose(t.id)} className="text-white opacity-90 hover:opacity-100">✕</button>
    </div>
  );
};

const ToastContainer = () => {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed right-6 bottom-6 z-50 flex flex-col gap-3">
      {toasts.map((t) => (
        <Toast key={t.id} t={t} onClose={remove} />
      ))}
    </div>
  );
};

export default ToastContainer;

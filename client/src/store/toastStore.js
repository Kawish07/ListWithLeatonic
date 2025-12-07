import { create } from 'zustand';

const useToastStore = create((set) => ({
  toasts: [],
  add: (toast) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const t = { id, type: toast.type || 'info', message: toast.message || '', duration: toast.duration ?? 4000 };
    set((s) => ({ toasts: [...s.toasts, t] }));
    if (t.duration !== 0) {
      setTimeout(() => set((s) => ({ toasts: s.toasts.filter(x => x.id !== id) })), t.duration);
    }
    return id;
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) }))
}));

export default useToastStore;

import { create } from 'zustand';

const useConfirmStore = create((set, get) => ({
  isOpen: false,
  message: '',
  callback: null,
  show: (message, callback) => set({ isOpen: true, message: message || 'Are you sure?', callback }),
  confirm: async () => {
    const cb = get().callback;
    set({ isOpen: false, message: '', callback: null });
    if (cb) await cb();
  },
  cancel: () => set({ isOpen: false, message: '', callback: null })
}));

export default useConfirmStore;

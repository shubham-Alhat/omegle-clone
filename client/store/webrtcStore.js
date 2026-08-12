import { create } from "zustand";

const useStore = create((set, get) => ({
  localStream: null,
  setLocalStream: (stream) => {
    if (get().localStream) return;
    set({ localStream: stream });
  },
}));

export default useStore;

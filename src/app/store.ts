import { create } from "zustand";


export type Session = { userId: string; email: string } | null;


type AppState = {
session: Session;
setSession: (s: Session) => void;
};


export const useAppStore = create<AppState>((set) => ({
session: null,
setSession: (s) => set({ session: s }),
}));
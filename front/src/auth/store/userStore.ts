import create from "zustand";
import { persist } from "zustand/middleware";

interface User {
  baseCurrency: string;
  email: string;
  id: string;
  language: string;
}

interface UserStore {
  user: User | null;
  setUser: (u: User | null) => void;
}

export const useUserStore = create<UserStore>(
  persist(
    (set) => ({
      user: null as User | null,
      setUser: (u) => set({ user: u }),
    }),
    { name: "pfa-user" }
  )
);

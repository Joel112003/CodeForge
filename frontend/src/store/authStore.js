import { create } from "zustand";

const useAuthStore = create((set) => ({
  user: null,
  csrfToken: null,
  hydrated: false,
  setAuth: (user, csrfToken) => set({ user, csrfToken }),
  setHydrated: (hydrated) => set({ hydrated }),
  logout: () => set({ user: null, csrfToken: null }),
}));

export default useAuthStore;

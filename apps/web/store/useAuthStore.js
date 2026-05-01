import { create } from "zustand";
import api from "../lib/axios.js";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback;

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  register: async (payload) => {
    set({ isLoading: true });

    try {
      const response = await api.post("/auth/register", payload);

      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });

      return response.data.user;
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      throw new Error(getErrorMessage(error, "Registration failed."));
    }
  },

  login: async (payload) => {
    set({ isLoading: true });

    try {
      const response = await api.post("/auth/login", payload);

      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });

      return response.data.user;
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      throw new Error(getErrorMessage(error, "Login failed."));
    }
  },

  logout: async () => {
    set({ isLoading: true });

    try {
      await api.post("/auth/logout");
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });

    try {
      const response = await api.get("/auth/me");

      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });

      return response.data.user;
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return null;
    }
  },
}));

export default useAuthStore;

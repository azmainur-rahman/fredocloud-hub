import { create } from "zustand";
import api from "../lib/axios.js";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback;

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  setUser: (user) => {
    set({ user, isAuthenticated: Boolean(user) });
  },

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

  uploadAvatar: async (file) => {
    set({ isLoading: true });

    try {
      const formData = new FormData();

      formData.append("avatar", file);

      const response = await api.post("/users/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });

      return response.data.user;
    } catch (error) {
      set({ isLoading: false });
      throw new Error(getErrorMessage(error, "Failed to upload avatar."));
    }
  },
}));

export default useAuthStore;

import { create } from "zustand";
import api from "../lib/axios.js";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback;

const useGoalStore = create((set, get) => ({
  goals: [],
  isLoading: false,

  upsertGoal: (goal) => {
    set({
      goals: get().goals.some((currentGoal) => currentGoal.id === goal.id)
        ? get().goals.map((currentGoal) =>
            currentGoal.id === goal.id ? goal : currentGoal,
          )
        : [goal, ...get().goals],
    });
  },

  removeGoal: (goalId) => {
    set({ goals: get().goals.filter((goal) => goal.id !== goalId) });
  },

  fetchGoals: async (workspaceId) => {
    if (!workspaceId) {
      set({ goals: [] });
      return [];
    }

    set({ isLoading: true });

    try {
      const response = await api.get(`/workspaces/${workspaceId}/goals`);
      const goals = response.data.goals || [];

      set({ goals, isLoading: false });

      return goals;
    } catch (error) {
      set({ isLoading: false });
      throw new Error(getErrorMessage(error, "Failed to fetch goals."));
    }
  },

  createGoal: async (workspaceId, payload) => {
    set({ isLoading: true });

    try {
      const response = await api.post(
        `/workspaces/${workspaceId}/goals`,
        payload,
      );
      const goal = response.data.goal;

      set({ goals: [goal, ...get().goals], isLoading: false });

      return goal;
    } catch (error) {
      set({ isLoading: false });
      throw new Error(getErrorMessage(error, "Failed to create goal."));
    }
  },

  updateGoal: async (workspaceId, goalId, payload) => {
    set({ isLoading: true });

    try {
      const response = await api.put(
        `/workspaces/${workspaceId}/goals/${goalId}`,
        payload,
      );
      const goal = response.data.goal;

      set({
        goals: get().goals.map((currentGoal) =>
          currentGoal.id === goal.id ? goal : currentGoal,
        ),
        isLoading: false,
      });

      return goal;
    } catch (error) {
      set({ isLoading: false });
      throw new Error(getErrorMessage(error, "Failed to update goal."));
    }
  },

  deleteGoal: async (workspaceId, goalId) => {
    set({ isLoading: true });

    try {
      await api.delete(`/workspaces/${workspaceId}/goals/${goalId}`);

      set({
        goals: get().goals.filter((goal) => goal.id !== goalId),
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw new Error(getErrorMessage(error, "Failed to delete goal."));
    }
  },
}));

export default useGoalStore;

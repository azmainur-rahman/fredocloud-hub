import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../lib/axios.js";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback;

const useWorkspaceStore = create(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspace: null,
      isLoading: false,

      fetchWorkspaces: async () => {
        set({ isLoading: true });

        try {
          const response = await api.get("/workspaces");
          const workspaces = response.data.workspaces || [];
          const currentActive = get().activeWorkspace;
          const activeWorkspace =
            workspaces.find(
              (workspace) => workspace.id === currentActive?.id,
            ) ||
            workspaces[0] ||
            null;

          set({ workspaces, activeWorkspace, isLoading: false });

          return workspaces;
        } catch (error) {
          set({ workspaces: [], activeWorkspace: null, isLoading: false });
          throw new Error(
            getErrorMessage(error, "Failed to fetch workspaces."),
          );
        }
      },

      createWorkspace: async (payload) => {
        set({ isLoading: true });

        try {
          const response = await api.post("/workspaces", payload);
          const workspace = response.data.workspace;
          const workspaces = [...get().workspaces, workspace];

          set({ workspaces, activeWorkspace: workspace, isLoading: false });

          return workspace;
        } catch (error) {
          set({ isLoading: false });
          throw new Error(
            getErrorMessage(error, "Failed to create workspace."),
          );
        }
      },

      inviteMember: async (workspaceId, email, role) => {
        set({ isLoading: true });

        try {
          const response = await api.post(`/workspaces/${workspaceId}/invite`, {
            email: email.trim(),
            role,
          });

          set({ isLoading: false });

          return response.data.member;
        } catch (error) {
          set({ isLoading: false });
          throw new Error(getErrorMessage(error, "Failed to invite member."));
        }
      },

      deleteWorkspace: async (workspaceId) => {
        set({ isLoading: true });

        try {
          await api.delete(`/workspaces/${workspaceId}`);

          const workspaces = get().workspaces.filter(
            (workspace) => workspace.id !== workspaceId,
          );

          set({
            workspaces,
            activeWorkspace: workspaces[0] || null,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw new Error(
            getErrorMessage(error, "Failed to delete workspace."),
          );
        }
      },

      setActiveWorkspace: (workspaceId) => {
        const activeWorkspace =
          get().workspaces.find((workspace) => workspace.id === workspaceId) ||
          null;

        set({ activeWorkspace });
      },
    }),
    {
      name: "fredo_workspace_storage",
      partialize: (state) => ({ activeWorkspace: state.activeWorkspace }),
    },
  ),
);

export default useWorkspaceStore;

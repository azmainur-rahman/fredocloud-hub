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
      members: [],
      onlineMembers: [],
      auditLogs: [],
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

      fetchMembers: async (workspaceId) => {
        if (!workspaceId) {
          set({ members: [] });
          return [];
        }

        try {
          const response = await api.get(`/workspaces/${workspaceId}/members`);
          const members = response.data.members || [];

          set({ members });

          return members;
        } catch (error) {
          set({ members: [] });
          throw new Error(getErrorMessage(error, "Failed to fetch members."));
        }
      },

      fetchAuditLogs: async (workspaceId) => {
        if (!workspaceId) {
          set({ auditLogs: [] });
          return [];
        }

        try {
          const response = await api.get(
            `/workspaces/${workspaceId}/audit-logs`,
          );
          const auditLogs = response.data.auditLogs || [];

          set({ auditLogs });

          return auditLogs;
        } catch (error) {
          set({ auditLogs: [] });
          throw new Error(
            getErrorMessage(error, "Failed to fetch audit logs."),
          );
        }
      },

      createWorkspace: async (payload) => {
        set({ isLoading: true });

        try {
          const response = await api.post("/workspaces", payload);
          const workspace = {
            ...response.data.workspace,
            role: response.data.workspace?.role || "ADMIN",
          };
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
          const member = response.data.member;

          set({
            members: get().members.some(
              (currentMember) => currentMember.id === member.id,
            )
              ? get().members.map((currentMember) =>
                  currentMember.id === member.id ? member : currentMember,
                )
              : [...get().members, member],
            isLoading: false,
          });

          return member;
        } catch (error) {
          set({ isLoading: false });
          throw new Error(getErrorMessage(error, "Failed to invite member."));
        }
      },

      updateWorkspace: async (workspaceId, payload) => {
        set({ isLoading: true });

        try {
          const response = await api.put(`/workspaces/${workspaceId}`, payload);
          const workspace = response.data.workspace;
          const workspaces = get().workspaces.map((currentWorkspace) =>
            currentWorkspace.id === workspace.id
              ? { ...currentWorkspace, ...workspace }
              : currentWorkspace,
          );

          set({
            workspaces,
            activeWorkspace: { ...get().activeWorkspace, ...workspace },
            isLoading: false,
          });

          return workspace;
        } catch (error) {
          set({ isLoading: false });
          throw new Error(
            getErrorMessage(error, "Failed to update workspace."),
          );
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
            members: [],
            onlineMembers: [],
            auditLogs: [],
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

      setOnlineMembers: (members) => {
        set({ onlineMembers: members || [] });
      },

      upsertWorkspace: (workspace) => {
        const workspaces = get().workspaces.some(
          (currentWorkspace) => currentWorkspace.id === workspace.id,
        )
          ? get().workspaces.map((currentWorkspace) =>
              currentWorkspace.id === workspace.id
                ? { ...currentWorkspace, ...workspace }
                : currentWorkspace,
            )
          : [...get().workspaces, workspace];

        set({
          workspaces,
          activeWorkspace:
            get().activeWorkspace?.id === workspace.id
              ? { ...get().activeWorkspace, ...workspace }
              : get().activeWorkspace,
        });
      },

      removeWorkspace: (workspaceId) => {
        const workspaces = get().workspaces.filter(
          (workspace) => workspace.id !== workspaceId,
        );

        set({
          workspaces,
          activeWorkspace:
            get().activeWorkspace?.id === workspaceId
              ? workspaces[0] || null
              : get().activeWorkspace,
          members: get().activeWorkspace?.id === workspaceId ? [] : get().members,
          onlineMembers:
            get().activeWorkspace?.id === workspaceId
              ? []
              : get().onlineMembers,
          auditLogs:
            get().activeWorkspace?.id === workspaceId ? [] : get().auditLogs,
        });
      },

      upsertMember: (member) => {
        set({
          members: get().members.some(
            (currentMember) => currentMember.id === member.id,
          )
            ? get().members.map((currentMember) =>
                currentMember.id === member.id ? member : currentMember,
              )
            : [...get().members, member],
        });
      },
    }),
    {
      name: "fredo_workspace_storage",
      partialize: (state) => ({ activeWorkspace: state.activeWorkspace }),
    },
  ),
);

export default useWorkspaceStore;

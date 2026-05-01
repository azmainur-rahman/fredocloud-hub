"use client";

import { useEffect } from "react";
import Header from "../../components/layout/Header.jsx";
import Sidebar from "../../components/layout/Sidebar.jsx";
import socket from "../../lib/socket.js";
import useActionItemStore from "../../store/useActionItemStore.js";
import useAnnouncementStore from "../../store/useAnnouncementStore.js";
import useAuthStore from "../../store/useAuthStore.js";
import useGoalStore from "../../store/useGoalStore.js";
import useWorkspaceStore from "../../store/useWorkspaceStore.js";

export default function DashboardLayout({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const fetchWorkspaces = useWorkspaceStore((state) => state.fetchWorkspaces);
  const upsertGoal = useGoalStore((state) => state.upsertGoal);
  const removeGoal = useGoalStore((state) => state.removeGoal);
  const upsertAnnouncement = useAnnouncementStore(
    (state) => state.upsertAnnouncement,
  );
  const removeAnnouncement = useAnnouncementStore(
    (state) => state.removeAnnouncement,
  );
  const upsertActionItem = useActionItemStore(
    (state) => state.upsertActionItem,
  );
  const removeActionItem = useActionItemStore(
    (state) => state.removeActionItem,
  );

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkspaces().catch(() => null);
    }
  }, [fetchWorkspaces, isAuthenticated]);

  useEffect(() => {
    if (!activeWorkspace?.id) {
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join_workspace", activeWorkspace.id);

    const handleGoal = ({ goal }) => upsertGoal(goal);
    const handleGoalDeleted = ({ goalId }) => removeGoal(goalId);
    const handleAnnouncement = ({ announcement }) =>
      upsertAnnouncement(announcement);
    const handleAnnouncementDeleted = ({ announcementId }) =>
      removeAnnouncement(announcementId);
    const handleActionItem = ({ actionItem }) => upsertActionItem(actionItem);
    const handleActionItemDeleted = ({ actionItemId }) =>
      removeActionItem(actionItemId);

    socket.on("goal_created", handleGoal);
    socket.on("goal_updated", handleGoal);
    socket.on("goal_deleted", handleGoalDeleted);
    socket.on("announcement_posted", handleAnnouncement);
    socket.on("announcement_updated", handleAnnouncement);
    socket.on("announcement_deleted", handleAnnouncementDeleted);
    socket.on("action_item_created", handleActionItem);
    socket.on("action_item_updated", handleActionItem);
    socket.on("item_status_changed", handleActionItem);
    socket.on("action_item_deleted", handleActionItemDeleted);

    return () => {
      socket.emit("leave_workspace", activeWorkspace.id);
      socket.off("goal_created", handleGoal);
      socket.off("goal_updated", handleGoal);
      socket.off("goal_deleted", handleGoalDeleted);
      socket.off("announcement_posted", handleAnnouncement);
      socket.off("announcement_updated", handleAnnouncement);
      socket.off("announcement_deleted", handleAnnouncementDeleted);
      socket.off("action_item_created", handleActionItem);
      socket.off("action_item_updated", handleActionItem);
      socket.off("item_status_changed", handleActionItem);
      socket.off("action_item_deleted", handleActionItemDeleted);
    };
  }, [
    activeWorkspace?.id,
    removeActionItem,
    removeAnnouncement,
    removeGoal,
    upsertActionItem,
    upsertAnnouncement,
    upsertGoal,
  ]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Sidebar />
      <div className="min-h-screen md:pl-72">
        <Header />
        <main className="px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}

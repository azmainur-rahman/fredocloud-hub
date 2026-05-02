"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "../../components/layout/Header.jsx";
import Sidebar from "../../components/layout/Sidebar.jsx";
import socket from "../../lib/socket.js";
import useActionItemStore from "../../store/useActionItemStore.js";
import useAnnouncementStore from "../../store/useAnnouncementStore.js";
import useAuthStore from "../../store/useAuthStore.js";
import useGoalStore from "../../store/useGoalStore.js";
import useNotificationStore from "../../store/useNotificationStore.js";
import useWorkspaceStore from "../../store/useWorkspaceStore.js";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const fetchWorkspaces = useWorkspaceStore((state) => state.fetchWorkspaces);
  const fetchMembers = useWorkspaceStore((state) => state.fetchMembers);
  const setOnlineMembers = useWorkspaceStore((state) => state.setOnlineMembers);
  const upsertWorkspace = useWorkspaceStore((state) => state.upsertWorkspace);
  const removeWorkspace = useWorkspaceStore((state) => state.removeWorkspace);
  const upsertMember = useWorkspaceStore((state) => state.upsertMember);
  const fetchNotifications = useNotificationStore(
    (state) => state.fetchNotifications,
  );
  const upsertNotification = useNotificationStore(
    (state) => state.upsertNotification,
  );
  const upsertGoal = useGoalStore((state) => state.upsertGoal);
  const removeGoal = useGoalStore((state) => state.removeGoal);
  const addGoalUpdate = useGoalStore((state) => state.addGoalUpdate);
  const upsertAnnouncement = useAnnouncementStore(
    (state) => state.upsertAnnouncement,
  );
  const removeAnnouncement = useAnnouncementStore(
    (state) => state.removeAnnouncement,
  );
  const addComment = useAnnouncementStore((state) => state.addComment);
  const applyReactionChange = useAnnouncementStore(
    (state) => state.applyReactionChange,
  );
  const upsertActionItem = useActionItemStore(
    (state) => state.upsertActionItem,
  );
  const removeActionItem = useActionItemStore(
    (state) => state.removeActionItem,
  );

  useEffect(() => {
    checkAuth().finally(() => setHasCheckedAuth(true));
  }, [checkAuth]);

  useEffect(() => {
    if (hasCheckedAuth && !authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, hasCheckedAuth, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkspaces().catch(() => null);
      fetchNotifications().catch(() => null);
    }
  }, [fetchNotifications, fetchWorkspaces, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && activeWorkspace?.id) {
      fetchMembers(activeWorkspace.id).catch(() => null);
    }
  }, [activeWorkspace?.id, fetchMembers, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join_user", user.id);

    if (activeWorkspace?.id) {
      socket.emit("join_workspace", {
        workspaceId: activeWorkspace.id,
        user: {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
      });
    }

    const handleGoal = ({ goal }) => upsertGoal(goal);
    const handleGoalDeleted = ({ goalId }) => removeGoal(goalId);
    const handleGoalUpdate = ({ goalId, goalUpdate }) =>
      addGoalUpdate(goalId, goalUpdate);
    const handleAnnouncement = ({ announcement }) =>
      upsertAnnouncement(announcement);
    const handleAnnouncementDeleted = ({ announcementId }) =>
      removeAnnouncement(announcementId);
    const handleAnnouncementComment = ({ announcementId, comment }) =>
      addComment(announcementId, comment);
    const handleAnnouncementReaction = ({
      announcementId,
      reaction,
      removed,
    }) => applyReactionChange(announcementId, reaction, removed);
    const handleActionItem = ({ actionItem }) => upsertActionItem(actionItem);
    const handleActionItemDeleted = ({ actionItemId }) =>
      removeActionItem(actionItemId);
    const handlePresence = ({ members }) => setOnlineMembers(members);
    const handleWorkspaceInvited = () => {
      fetchWorkspaces().catch(() => null);
      fetchNotifications().catch(() => null);
    };
    const handleNotificationCreated = ({ notification }) =>
      upsertNotification(notification);
    const handleWorkspaceUpdated = ({ workspace }) =>
      upsertWorkspace(workspace);
    const handleWorkspaceDeleted = ({ workspaceId }) =>
      removeWorkspace(workspaceId);
    const handleMemberInvited = ({ member }) => upsertMember(member);

    socket.on("goal_created", handleGoal);
    socket.on("goal_updated", handleGoal);
    socket.on("goal_deleted", handleGoalDeleted);
    socket.on("goal_update_created", handleGoalUpdate);
    socket.on("announcement_posted", handleAnnouncement);
    socket.on("announcement_updated", handleAnnouncement);
    socket.on("announcement_deleted", handleAnnouncementDeleted);
    socket.on("announcement_comment_created", handleAnnouncementComment);
    socket.on("announcement_reaction_changed", handleAnnouncementReaction);
    socket.on("action_item_created", handleActionItem);
    socket.on("action_item_updated", handleActionItem);
    socket.on("item_status_changed", handleActionItem);
    socket.on("action_item_deleted", handleActionItemDeleted);
    socket.on("workspace_presence", handlePresence);
    socket.on("workspace_invited", handleWorkspaceInvited);
    socket.on("notification_created", handleNotificationCreated);
    socket.on("workspace_updated", handleWorkspaceUpdated);
    socket.on("workspace_deleted", handleWorkspaceDeleted);
    socket.on("member_invited", handleMemberInvited);

    return () => {
      if (activeWorkspace?.id) {
        socket.emit("leave_workspace", activeWorkspace.id);
      }
      socket.off("goal_created", handleGoal);
      socket.off("goal_updated", handleGoal);
      socket.off("goal_deleted", handleGoalDeleted);
      socket.off("goal_update_created", handleGoalUpdate);
      socket.off("announcement_posted", handleAnnouncement);
      socket.off("announcement_updated", handleAnnouncement);
      socket.off("announcement_deleted", handleAnnouncementDeleted);
      socket.off("announcement_comment_created", handleAnnouncementComment);
      socket.off("announcement_reaction_changed", handleAnnouncementReaction);
      socket.off("action_item_created", handleActionItem);
      socket.off("action_item_updated", handleActionItem);
      socket.off("item_status_changed", handleActionItem);
      socket.off("action_item_deleted", handleActionItemDeleted);
      socket.off("workspace_presence", handlePresence);
      socket.off("workspace_invited", handleWorkspaceInvited);
      socket.off("notification_created", handleNotificationCreated);
      socket.off("workspace_updated", handleWorkspaceUpdated);
      socket.off("workspace_deleted", handleWorkspaceDeleted);
      socket.off("member_invited", handleMemberInvited);
      setOnlineMembers([]);
    };
  }, [
    activeWorkspace?.id,
    addComment,
    addGoalUpdate,
    applyReactionChange,
    fetchNotifications,
    fetchWorkspaces,
    isAuthenticated,
    removeActionItem,
    removeAnnouncement,
    removeGoal,
    removeWorkspace,
    setOnlineMembers,
    upsertActionItem,
    upsertAnnouncement,
    upsertGoal,
    upsertMember,
    upsertNotification,
    upsertWorkspace,
    user?.avatarUrl,
    user?.id,
    user?.name,
  ]);

  if (!hasCheckedAuth || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

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

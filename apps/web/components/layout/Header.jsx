"use client";

import { Bell, Send, Trash2, Upload, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore.js";
import useNotificationStore from "../../store/useNotificationStore.js";
import useWorkspaceStore from "../../store/useWorkspaceStore.js";

export default function Header() {
  const user = useAuthStore((state) => state.user);
  const uploadAvatar = useAuthStore((state) => state.uploadAvatar);
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const isLoading = useWorkspaceStore((state) => state.isLoading);
  const inviteMember = useWorkspaceStore((state) => state.inviteMember);
  const deleteWorkspace = useWorkspaceStore((state) => state.deleteWorkspace);
  const notifications = useNotificationStore((state) => state.notifications);
  const fetchNotifications = useNotificationStore(
    (state) => state.fetchNotifications,
  );
  const markRead = useNotificationStore((state) => state.markRead);
  const accentColor = activeWorkspace?.accentColor || "#f97316";
  const isAdmin = activeWorkspace?.role === "ADMIN";
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "MEMBER",
  });
  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  const updateInviteField = (event) => {
    setInviteForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleInvite = async (event) => {
    event.preventDefault();

    if (!activeWorkspace?.id) {
      toast.error("Select a workspace first.");
      return;
    }

    try {
      await inviteMember(activeWorkspace.id, inviteForm.email, inviteForm.role);
      toast.success("Member invited.");
      setInviteForm({ email: "", role: "MEMBER" });
      setIsInviteOpen(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      await uploadAvatar(file);
      toast.success("Avatar updated.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      event.target.value = "";
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!activeWorkspace?.id) {
      toast.error("Select a workspace first.");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${activeWorkspace.name}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteWorkspace(activeWorkspace.id);
      toast.success("Workspace deleted.");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const toggleNotifications = async () => {
    setIsNotificationsOpen((current) => !current);

    try {
      await fetchNotifications();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (notification.read) {
      return;
    }

    try {
      await markRead(notification.id);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-gray-900/85 px-4 py-4 text-white backdrop-blur md:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
            Current workspace
          </p>
          <h1 className="mt-1 truncate text-xl font-bold sm:text-2xl">
            {activeWorkspace?.name || "No workspace selected"}
          </h1>
          <p className="mt-1 max-w-xl truncate text-sm text-gray-400">
            {activeWorkspace?.description ||
              "Create or select a workspace to begin."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin ? (
            <>
              <button
                className="hidden h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold text-gray-950 transition hover:brightness-110 sm:inline-flex"
                onClick={() => setIsInviteOpen(true)}
                style={{ backgroundColor: accentColor }}
                type="button"
              >
                <Send size={16} />
                Invite Member
              </button>
              <button
                className="hidden h-10 items-center justify-center gap-2 rounded-lg border border-red-500/40 px-4 text-sm font-bold text-red-300 transition hover:bg-red-500/10 sm:inline-flex"
                onClick={handleDeleteWorkspace}
                type="button"
              >
                <Trash2 size={16} />
                Delete Workspace
              </button>
            </>
          ) : null}
          <div className="relative">
            <button
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-gray-300 transition-colors hover:border-orange-500/60 hover:text-orange-300"
              onClick={toggleNotifications}
              type="button"
            >
              <Bell size={18} />
              {unreadCount > 0 ? (
                <span
                  className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-gray-950"
                  style={{ backgroundColor: accentColor }}
                >
                  {unreadCount}
                </span>
              ) : null}
            </button>
            {isNotificationsOpen ? (
              <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-white/10 bg-gray-950 shadow-2xl shadow-black/40">
                <div className="border-b border-white/10 px-4 py-3">
                  <p className="text-sm font-bold text-white">Notifications</p>
                  <p className="text-xs text-gray-500">{unreadCount} unread</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-gray-400">
                      No notifications yet.
                    </p>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        className={`block w-full border-b border-white/5 px-4 py-3 text-left text-sm transition hover:bg-white/[0.04] ${
                          notification.read ? "text-gray-400" : "text-white"
                        }`}
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        type="button"
                      >
                        <span className="block leading-6">
                          {notification.message}
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-2 py-2 pr-4">
            <div
              className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-gray-950"
              style={{ backgroundColor: accentColor }}
            >
              {user?.avatarUrl ? (
                <img
                  alt={user.name || "User"}
                  className="h-full w-full object-cover"
                  src={user.avatarUrl}
                />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || "U"
              )}
            </div>
            <span className="hidden max-w-32 truncate text-sm font-semibold text-gray-200 sm:block">
              {user?.name || "User"}
            </span>
            <label className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/10 text-gray-400 transition hover:border-orange-500/60 hover:text-orange-300">
              <Upload size={15} />
              <input
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                type="file"
              />
            </label>
          </div>
        </div>
      </div>

      {isInviteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form
            className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-950 p-6 shadow-2xl shadow-orange-950/40"
            onSubmit={handleInvite}
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-400">
                  Invite
                </p>
                <h2 className="mt-2 text-2xl font-bold">Invite member</h2>
              </div>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:text-white"
                onClick={() => setIsInviteOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-300">
                  Email
                </span>
                <input
                  className="h-11 w-full rounded-lg border border-gray-800 bg-gray-900 px-4 text-sm text-white outline-none transition focus:border-orange-500"
                  name="email"
                  onChange={updateInviteField}
                  placeholder="teammate@example.com"
                  type="email"
                  value={inviteForm.email}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-300">
                  Role
                </span>
                <select
                  className="h-11 w-full rounded-lg border border-gray-800 bg-gray-900 px-4 text-sm text-white outline-none transition focus:border-orange-500"
                  name="role"
                  onChange={updateInviteField}
                  value={inviteForm.role}
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </label>
            </div>

            <button
              className="mt-6 h-11 w-full rounded-lg text-sm font-bold text-gray-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
              style={{ backgroundColor: accentColor }}
              type="submit"
            >
              {isLoading ? "Inviting..." : "Send invite"}
            </button>
          </form>
        </div>
      ) : null}
    </header>
  );
}

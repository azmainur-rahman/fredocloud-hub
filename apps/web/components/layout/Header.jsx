"use client";

import { Bell, Pencil, Send, Trash2, Upload, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore.js";
import useNotificationStore from "../../store/useNotificationStore.js";
import useWorkspaceStore from "../../store/useWorkspaceStore.js";

export default function Header() {
  const user = useAuthStore((state) => state.user);
  const isAvatarLoading = useAuthStore((state) => state.isAvatarLoading);
  const uploadAvatar = useAuthStore((state) => state.uploadAvatar);
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const onlineMembers = useWorkspaceStore((state) => state.onlineMembers);
  const isLoading = useWorkspaceStore((state) => state.isLoading);
  const inviteMember = useWorkspaceStore((state) => state.inviteMember);
  const updateWorkspace = useWorkspaceStore((state) => state.updateWorkspace);
  const deleteWorkspace = useWorkspaceStore((state) => state.deleteWorkspace);
  const notifications = useNotificationStore((state) => state.notifications);
  const fetchNotifications = useNotificationStore(
    (state) => state.fetchNotifications,
  );
  const markRead = useNotificationStore((state) => state.markRead);
  const accentColor = activeWorkspace?.accentColor || "#f97316";
  const isAdmin = activeWorkspace?.role === "ADMIN";
  const [isEditWorkspaceOpen, setIsEditWorkspaceOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "MEMBER",
  });
  const [workspaceForm, setWorkspaceForm] = useState({
    name: "",
    description: "",
    accentColor: "#f97316",
  });
  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  const openEditWorkspace = () => {
    if (!activeWorkspace) {
      toast.error("Select a workspace first.");
      return;
    }

    setWorkspaceForm({
      name: activeWorkspace.name || "",
      description: activeWorkspace.description || "",
      accentColor: activeWorkspace.accentColor || "#f97316",
    });
    setIsEditWorkspaceOpen(true);
  };

  const updateWorkspaceField = (event) => {
    setWorkspaceForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const updateInviteField = (event) => {
    setInviteForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleUpdateWorkspace = async (event) => {
    event.preventDefault();

    if (!activeWorkspace?.id) {
      toast.error("Select a workspace first.");
      return;
    }

    try {
      await updateWorkspace(activeWorkspace.id, workspaceForm);
      toast.success("Workspace updated.");
      setIsEditWorkspaceOpen(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleInvite = async (event) => {
    event.preventDefault();

    if (!activeWorkspace?.id) {
      toast.error("Select a workspace first.");
      return;
    }

    if (isInviting) {
      return;
    }

    setIsInviting(true);

    try {
      await inviteMember(activeWorkspace.id, inviteForm.email, inviteForm.role);
      toast.success("Member invited.");
      setInviteForm({ email: "", role: "MEMBER" });
      setIsInviteOpen(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const loadingToast = toast.loading("Uploading avatar...");

    try {
      await uploadAvatar(file);
      toast.success("Avatar updated.", { id: loadingToast });
      setIsProfileOpen(false);
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
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
          {activeWorkspace?.role ? (
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Role: {activeWorkspace.role === "ADMIN" ? "Admin" : "Member"}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-gray-300 lg:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {onlineMembers.length} online
          </div>
          {isAdmin ? (
            <>
              <button
                className="hidden h-10 items-center justify-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-bold text-gray-200 transition hover:border-orange-500/60 hover:text-orange-300 sm:inline-flex"
                onClick={openEditWorkspace}
                type="button"
              >
                <Pencil size={16} />
                Edit Workspace
              </button>
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
                  className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-gray-900"
                  aria-label={`${unreadCount} unread notifications`}
                />
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
          <button
            className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-2 py-2 pr-4 transition hover:border-orange-500/60"
            onClick={() => setIsProfileOpen(true)}
            type="button"
          >
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
          </button>
        </div>
      </div>

      {isEditWorkspaceOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form
            className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-950 p-6 shadow-2xl shadow-orange-950/40"
            onSubmit={handleUpdateWorkspace}
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-400">
                  Workspace
                </p>
                <h2 className="mt-2 text-2xl font-bold">Edit workspace</h2>
              </div>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:text-white"
                onClick={() => setIsEditWorkspaceOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-300">
                  Name
                </span>
                <input
                  className="h-11 w-full rounded-lg border border-gray-800 bg-gray-900 px-4 text-sm text-white outline-none transition focus:border-orange-500"
                  name="name"
                  onChange={updateWorkspaceField}
                  value={workspaceForm.name}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-300">
                  Description
                </span>
                <textarea
                  className="min-h-28 w-full rounded-lg border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                  maxLength={150}
                  name="description"
                  onChange={updateWorkspaceField}
                  value={workspaceForm.description}
                />
                <span className="mt-2 block text-right text-xs text-gray-500">
                  {workspaceForm.description.length}/150
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-300">
                  Accent Color
                </span>
                <input
                  className="h-10 w-full cursor-pointer rounded-md border-0 bg-transparent p-0 [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-md"
                  name="accentColor"
                  onChange={updateWorkspaceField}
                  type="color"
                  value={workspaceForm.accentColor}
                />
              </label>
            </div>

            <button
              className="mt-6 h-11 w-full rounded-lg text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
              style={{
                backgroundColor: workspaceForm.accentColor || "#f97316",
              }}
              type="submit"
            >
              {isLoading ? "Saving..." : "Save workspace"}
            </button>
          </form>
        </div>
      ) : null}

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
              disabled={isLoading || isInviting}
              style={{ backgroundColor: accentColor }}
              type="submit"
            >
              {isLoading || isInviting ? "Inviting..." : "Send invite"}
            </button>
          </form>
        </div>
      ) : null}

      {isProfileOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setIsProfileOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gray-950 p-6 shadow-2xl shadow-orange-950/40"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-400">
                  Profile
                </p>
                <h2 className="mt-2 text-2xl font-bold">Upload avatar</h2>
              </div>
              <button
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-gray-900 text-gray-300 transition hover:border-orange-500/60 hover:text-white"
                onClick={() => setIsProfileOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full text-xl font-bold text-gray-950"
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
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-white">
                  {user?.name || "User"}
                </p>
                <p className="truncate text-sm text-gray-400">
                  {user?.email || "No email available"}
                </p>
              </div>
            </div>

            <label className="mt-5 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-gray-900 px-4 py-6 text-center transition hover:border-orange-500/60 hover:bg-orange-500/5">
              <Upload className="mb-3 text-orange-400" size={24} />
              <span className="text-sm font-semibold text-white">
                Choose a profile image
              </span>
              <span className="mt-1 text-xs text-gray-500">
                PNG, JPG, or WebP
              </span>
              <input
                accept="image/*"
                className="hidden"
                disabled={isAvatarLoading}
                onChange={handleAvatarChange}
                type="file"
              />
            </label>

            <button
              className="mt-4 h-10 w-full rounded-lg border border-white/10 text-sm font-semibold text-gray-300 transition hover:border-orange-500/60 hover:text-orange-300"
              disabled={isAvatarLoading}
              onClick={() => setIsProfileOpen(false)}
              type="button"
            >
              {isAvatarLoading ? "Uploading..." : "Close"}
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}

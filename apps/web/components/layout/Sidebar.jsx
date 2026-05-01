"use client";

import {
  BarChart3,
  ClipboardList,
  LogOut,
  Megaphone,
  Plus,
  Target,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore.js";
import useWorkspaceStore from "../../store/useWorkspaceStore.js";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { label: "Goals", href: "/dashboard/goals", icon: Target },
  { label: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
  {
    label: "Action Items",
    href: "/dashboard/action-items",
    icon: ClipboardList,
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const authLoading = useAuthStore((state) => state.isLoading);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const isLoading = useWorkspaceStore((state) => state.isLoading);
  const createWorkspace = useWorkspaceStore((state) => state.createWorkspace);
  const setActiveWorkspace = useWorkspaceStore(
    (state) => state.setActiveWorkspace,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    accentColor: "#f97316",
  });
  const accentColor = activeWorkspace?.accentColor || "#f97316";

  const updateField = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleCreateWorkspace = async (event) => {
    event.preventDefault();

    try {
      await createWorkspace(form);
      toast.success("Workspace created.");
      setForm({
        name: "",
        description: "",
        accentColor: "#f97316",
      });
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out.");
      router.replace("/login");
    } catch {
      toast.error("Failed to log out.");
    }
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-white/10 bg-gray-950/95 px-5 py-6 text-white shadow-2xl shadow-black/30 backdrop-blur md:flex">
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl text-gray-950"
          style={{ backgroundColor: accentColor }}
        >
          <UsersRound size={22} />
        </div>
        <div>
          <p className="text-lg font-bold">FredoCloud</p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-orange-400">
            Team Hub
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Workspace
          </span>
          <select
            className="h-11 w-full rounded-lg border border-gray-800 bg-gray-900 px-3 text-sm font-semibold text-white outline-none transition-colors focus:border-orange-500"
            onChange={(event) => setActiveWorkspace(event.target.value)}
            value={activeWorkspace?.id || ""}
          >
            {workspaces.length === 0 ? (
              <option value="">No workspaces yet</option>
            ) : (
              workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))
            )}
          </select>
        </label>
        <button
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold text-gray-950 transition hover:brightness-110"
          onClick={() => setIsModalOpen(true)}
          style={{ backgroundColor: accentColor }}
          type="button"
        >
          <Plus size={17} />
          Create Workspace
        </button>
      </div>

      <nav className="mt-8 flex-1 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors ${
                isActive
                  ? "text-gray-950"
                  : "text-gray-300 hover:bg-orange-500/10 hover:text-orange-300"
              }`}
              href={item.href}
              key={item.href}
              style={isActive ? { backgroundColor: accentColor } : undefined}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form
            className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-950 p-6 shadow-2xl shadow-orange-950/40"
            onSubmit={handleCreateWorkspace}
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-400">
                  Workspace
                </p>
                <h2 className="mt-2 text-2xl font-bold">Create workspace</h2>
              </div>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:text-white"
                onClick={() => setIsModalOpen(false)}
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
                  onChange={updateField}
                  placeholder="Product Team"
                  value={form.name}
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
                  onChange={updateField}
                  placeholder="What this workspace is for"
                  value={form.description}
                />
                <span className="mt-2 block text-right text-xs text-gray-500">
                  {form.description.length}/150
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-300">
                  Accent Color
                </span>
                <input
                  className="h-10 w-full cursor-pointer rounded-md border-0 bg-transparent p-0 [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none"
                  name="accentColor"
                  onChange={updateField}
                  type="color"
                  value={form.accentColor}
                />
              </label>
            </div>

            <button
              className="mt-6 h-11 w-full rounded-lg text-sm font-bold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
              style={{
                backgroundColor: form.accentColor || "#f97316",
                color: "#fff",
              }}
              type="submit"
            >
              {isLoading ? "Creating..." : "Create workspace"}
            </button>
          </form>
        </div>
      ) : null}

      <button
        className="mt-6 flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-white/10 px-4 text-sm font-semibold text-gray-300 transition hover:border-orange-500/60 hover:bg-orange-500/10 hover:text-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={authLoading}
        onClick={handleLogout}
        type="button"
      >
        <LogOut size={17} />
        Logout
      </button>
    </aside>
  );
}

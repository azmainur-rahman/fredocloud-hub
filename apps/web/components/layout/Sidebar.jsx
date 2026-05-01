"use client";

import {
  BarChart3,
  ClipboardList,
  Megaphone,
  Target,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
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
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const setActiveWorkspace = useWorkspaceStore(
    (state) => state.setActiveWorkspace,
  );

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/10 bg-gray-950/95 px-5 py-6 text-white shadow-2xl shadow-black/30 backdrop-blur md:block">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-gray-950">
          <UsersRound size={22} />
        </div>
        <div>
          <p className="text-lg font-bold">FredoCloud</p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-orange-400">
            Team Hub
          </p>
        </div>
      </div>

      <label className="mb-8 block">
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

      <nav className="space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-gray-300 transition-colors hover:bg-orange-500/10 hover:text-orange-300"
              href={item.href}
              key={item.href}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

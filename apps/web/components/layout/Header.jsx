"use client";

import { Bell } from "lucide-react";
import useAuthStore from "../../store/useAuthStore.js";
import useWorkspaceStore from "../../store/useWorkspaceStore.js";

export default function Header() {
  const user = useAuthStore((state) => state.user);
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-gray-900/85 px-4 py-4 text-white backdrop-blur md:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
            Current workspace
          </p>
          <h1 className="mt-1 truncate text-xl font-bold sm:text-2xl">
            {activeWorkspace?.name || "No workspace selected"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-gray-300 transition-colors hover:border-orange-500/60 hover:text-orange-300"
            type="button"
          >
            <Bell size={18} />
          </button>
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-2 py-2 pr-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-gray-950">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <span className="hidden max-w-32 truncate text-sm font-semibold text-gray-200 sm:block">
              {user?.name || "User"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

"use client";

import useWorkspaceStore from "../../store/useWorkspaceStore.js";

export default function DashboardPage() {
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 shadow-2xl shadow-orange-950/20 sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-400">
        Dashboard
      </p>
      <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
        Welcome to {activeWorkspace?.name || "your workspace"}
      </h2>
      <p className="mt-4 max-w-2xl text-gray-300">
        Your workspace overview will appear here as goals, announcements, and
        action items are added.
      </p>
    </section>
  );
}

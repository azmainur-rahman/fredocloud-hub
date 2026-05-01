"use client";

import { useEffect } from "react";
import Header from "../../components/layout/Header.jsx";
import Sidebar from "../../components/layout/Sidebar.jsx";
import useAuthStore from "../../store/useAuthStore.js";
import useWorkspaceStore from "../../store/useWorkspaceStore.js";

export default function DashboardLayout({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const fetchWorkspaces = useWorkspaceStore((state) => state.fetchWorkspaces);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkspaces().catch(() => null);
    }
  }, [fetchWorkspaces, isAuthenticated]);

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

"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useAuthStore from "../store/useAuthStore.js";

export default function Home() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16 sm:px-10">
        <div className="max-w-4xl space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-200">
            <ShieldCheck size={16} />
            Secure workspace command center
          </div>
          <div className="space-y-5">
            <h1 className="text-4xl font-bold leading-tight sm:text-6xl lg:text-7xl">
              Run goals, updates, and action items from one polished hub.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-gray-300">
              FredoCloud Hub gives teams a calm, real-time home for shared
              objectives, announcements, and accountability.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 text-sm font-bold text-gray-950 transition hover:bg-orange-400"
              href="/login"
            >
              Go to Login
              <ArrowRight size={18} />
            </Link>
            <Link
              className="inline-flex h-12 items-center justify-center rounded-lg border border-white/10 px-6 text-sm font-semibold text-gray-200 transition hover:border-orange-500/60 hover:text-orange-300"
              href="/register"
            >
              Create account
            </Link>
          </div>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {["Workspaces", "Goals", "Announcements"].map((item) => (
            <div
              className="rounded-lg border border-white/10 bg-white/[0.04] p-5"
              key={item}
            >
              <p className="text-sm font-medium text-gray-400">{item}</p>
              <p className="mt-3 text-2xl font-semibold text-white">Ready</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

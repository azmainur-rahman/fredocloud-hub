"use client";

import { ArrowRight, LockKeyhole, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore.js";

const inputClassName =
  "w-full bg-gray-800 text-sm text-white outline-none transition-colors placeholder:text-gray-500 autofill:bg-gray-800 autofill:text-white autofill:shadow-[inset_0_0_0px_1000px_rgb(31,41,55)] autofill:[-webkit-text-fill-color:white]";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [form, setForm] = useState({ email: "", password: "" });

  const updateField = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await login(form);
      toast.success("Welcome back.");
      router.push("/");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-12 px-6 py-12 lg:grid-cols-[1fr_460px] lg:px-10">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-200">
            <Sparkles size={16} />
            Collaborative team hub
          </div>
          <div className="space-y-5">
            <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">
              Sign in to keep every goal moving.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-gray-300">
              Manage workspaces, announcements, goals, and action items from a
              focused dashboard built for fast-moving teams.
            </p>
          </div>
          <div className="grid max-w-2xl gap-4 sm:grid-cols-3">
            {["Live updates", "Team roles", "Goal tracking"].map((item) => (
              <div
                className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-gray-300"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <form
          className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-orange-950/30 backdrop-blur sm:p-8"
          onSubmit={handleSubmit}
        >
          <div className="mb-8 space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-400">
              Login
            </p>
            <h2 className="text-3xl font-bold">Welcome back</h2>
            <p className="text-sm leading-6 text-gray-400">
              Use your FredoCloud Hub account to continue.
            </p>
          </div>

          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-300">
                Email
              </span>
              <span className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 transition-colors focus-within:border-orange-500">
                <Mail className="text-gray-500" size={18} />
                <input
                  className={inputClassName}
                  name="email"
                  onChange={updateField}
                  placeholder="you@example.com"
                  type="email"
                  value={form.email}
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-300">
                Password
              </span>
              <span className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 transition-colors focus-within:border-orange-500">
                <LockKeyhole className="text-gray-500" size={18} />
                <input
                  className={inputClassName}
                  name="password"
                  onChange={updateField}
                  placeholder="Enter your password"
                  type="password"
                  value={form.password}
                />
              </span>
            </label>
          </div>

          <button
            className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 text-sm font-bold text-gray-950 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Signing in..." : "Sign in"}
            <ArrowRight size={18} />
          </button>

          <p className="mt-6 text-center text-sm text-gray-400">
            New here?{" "}
            <Link className="font-semibold text-orange-400" href="/register">
              Create an account
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}

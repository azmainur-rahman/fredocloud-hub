"use client";

import { ArrowRight, LockKeyhole, Mail, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore.js";

const inputClassName =
  "w-full bg-gray-800 text-sm text-white outline-none transition-colors placeholder:text-gray-500 autofill:bg-gray-800 autofill:text-white autofill:shadow-[inset_0_0_0px_1000px_rgb(31,41,55)] autofill:[-webkit-text-fill-color:white]";

const isStrongPassword = (password) =>
  password.length >= 8 && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const updateField = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isStrongPassword(form.password)) {
      toast.error(
        "Password must be at least 8 characters and include a number and special character.",
      );
      return;
    }

    try {
      await register(form);
      toast.success("Account created.");
      router.push("/");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-12 px-6 py-12 lg:grid-cols-[460px_1fr] lg:px-10">
        <form
          className="order-2 rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-orange-950/30 backdrop-blur sm:p-8 lg:order-1"
          onSubmit={handleSubmit}
        >
          <div className="mb-8 space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-400">
              Register
            </p>
            <h2 className="text-3xl font-bold">Create your account</h2>
            <p className="text-sm leading-6 text-gray-400">
              Start building a focused workspace for shared team goals.
            </p>
          </div>

          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-300">
                Name
              </span>
              <span className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 transition-colors focus-within:border-orange-500">
                <UserRound className="text-gray-500" size={18} />
                <input
                  className={inputClassName}
                  name="name"
                  onChange={updateField}
                  placeholder="Alex Morgan"
                  type="text"
                  value={form.name}
                />
              </span>
            </label>

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
                  placeholder="Choose a secure password"
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
            {isLoading ? "Creating account..." : "Create account"}
            <ArrowRight size={18} />
          </button>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already registered?{" "}
            <Link className="font-semibold text-orange-400" href="/login">
              Sign in
            </Link>
          </p>
        </form>

        <div className="order-1 space-y-8 lg:order-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-200">
            <Users size={16} />
            Build momentum together
          </div>
          <div className="space-y-5">
            <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">
              Turn team plans into visible progress.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-gray-300">
              Create a workspace, invite teammates, publish announcements, and
              keep action items connected to the goals that matter.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

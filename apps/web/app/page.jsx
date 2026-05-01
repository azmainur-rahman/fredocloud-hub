export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-start justify-center gap-8 px-6 py-20 sm:px-10">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
            FredoCloud Hub
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">
            Next.js App Router, JavaScript, and Tailwind are ready.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-300">
            This web app is running with plain JSX files in the Next.js App
            Router. The API service runs alongside it from the same Turborepo
            dev command.
          </p>
        </div>

        <div className="grid w-full gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-medium text-slate-400">Web</p>
            <p className="mt-2 text-2xl font-semibold">localhost:3000</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-medium text-slate-400">API</p>
            <p className="mt-2 text-2xl font-semibold">localhost:5000</p>
          </div>
        </div>
      </section>
    </main>
  );
}

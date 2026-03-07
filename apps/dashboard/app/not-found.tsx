import Link from "next/link";

export default function NotFoundPage(): JSX.Element {
  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">404</p>
      <h1 className="mt-3 text-3xl font-semibold text-white">Page not found</h1>
      <p className="mt-4 text-slate-300">
        The page you requested does not exist in this workspace.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
      >
        Back to dashboard
      </Link>
    </section>
  );
}

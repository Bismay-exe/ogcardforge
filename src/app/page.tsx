import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="max-w-2xl space-y-6">
        <span className="inline-block rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium uppercase tracking-wider text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          OG Card · v0.1.0
        </span>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Beautiful developer cards,
          <br />
          powered by live GitHub data.
        </h1>
        <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Generate polished profile banners and repo cards as embeddable
          SVG/PNG images — ready for any GitHub README.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <span className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            Builder UI · coming soon
          </span>
          <Link
            href="/api/v1/repo?owner=vercel&repo=next.js&template=modern"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Try the API →
          </Link>
        </div>
      </div>
    </main>
  );
}

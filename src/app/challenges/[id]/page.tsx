import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { isReleased, isOpen, isArchived } from "@/lib/challenges";
import { currentValue } from "@/lib/scoring";
import { Markdown } from "@/components/markdown";
import { SubmitForm } from "./submit-form";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function ChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const challenge = await db.challenge.findUnique({
    where: { id },
    include: {
      attachments: { orderBy: { createdAt: "asc" } },
      _count: { select: { solves: { where: { user: { hidden: false } } } } },
    },
  });

  if (!challenge) notFound();
  const released = isReleased(challenge);
  if (!released && user?.role !== "ADMIN") notFound();

  const open = isOpen(challenge);
  const archived = isArchived(challenge);
  const value = currentValue(challenge, challenge._count.solves);

  const solved = user
    ? !!(await db.solve.findUnique({
      where: { userId_challengeId: { userId: user.id, challengeId: id } },
      select: { id: true },
    }))
    : false;

  return (
    <article className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/challenges"
          className="inline-flex text-sm text-slate-400 transition hover:text-white"
        >
          ← All challenges
        </Link>
        {user?.role === "ADMIN" && (
          <Link
            href={`/admin/challenges/${challenge.id}`}
            className="text-sm text-amber-300 hover:underline"
          >
            Edit challenge (Admin) →
          </Link>
        )}
      </div>

      <header
        className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 ${
          challenge.volunteer && !archived ? "glass-volunteer" : "glass"
        }`}
      >
        <div
          className={`pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full blur-3xl ${
            archived ? "bg-amber-500/15" : challenge.volunteer ? "bg-indigo-500/20" : "bg-sky-500/20"
          }`}
        />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-sm text-accent">Week {challenge.week}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
              {challenge.title}
            </h1>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="chip">{challenge.category}</span>
              {challenge.volunteer && (
                <>
                  <span className="text-slate-600 text-xs font-bold">•</span>
                  <span className="text-xs text-indigo-400 font-medium">
                    by {challenge.volunteer}
                  </span>
                </>
              )}
              <span className="text-slate-400">
                {challenge._count.solves} solves
              </span>
              {archived && (
                <span className="chip border-amber-400/40 bg-amber-400/10 text-amber-300">
                  📦 Archived
                </span>
              )}
              {solved && (
                <span className="chip border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                  ✓ Solved
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            {archived ? (
              <>
                <p className="text-4xl font-extrabold text-amber-300">0</p>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  points · was{" "}
                  <span className="text-slate-400 line-through">
                    {challenge.initialPoints}
                  </span>
                </p>
              </>
            ) : (
              <>
                <p className="text-4xl font-extrabold text-sky-300">{value}</p>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  points · current
                </p>
              </>
            )}
          </div>
        </div>
      </header>

      {!released && (
        <p className="glass rounded-xl px-4 py-2.5 text-sm text-amber-300">
          Preview: this challenge is not released to players yet.
        </p>
      )}

      {archived && (
        <p className="glass rounded-xl border-amber-400/20 px-4 py-2.5 text-sm text-amber-300">
          📦 This challenge is <strong>archived</strong> — the window has closed.
          You can still solve it for practice, but it no longer awards points.
        </p>
      )}

      <section className="glass rounded-2xl p-6 sm:p-8">
        {challenge.description ? (
          <Markdown>{challenge.description}</Markdown>
        ) : (
          <p className="text-slate-400">No description provided.</p>
        )}
      </section>

      {challenge.attachments.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Files
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {challenge.attachments.map((a) => (
              <li key={a.id}>
                <a
                  href={`/api/files/${a.id}`}
                  className="glass glass-hover flex items-center justify-between rounded-xl px-4 py-3 text-sm"
                >
                  <span className="flex items-center gap-2 font-mono text-sky-300">
                    <span className="text-slate-500">↓</span>
                    {a.originalName}
                  </span>
                  <span className="text-slate-500">{formatBytes(a.size)}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="glass rounded-2xl p-6 sm:p-8">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Submit flag
        </h2>
        {!user ? (
          <p className="text-slate-400">
            <Link href="/login" className="text-accent hover:underline">
              Sign in
            </Link>{" "}
            to submit a flag.
          </p>
        ) : solved ? (
          <p className="text-emerald-300">
            ✓ You&apos;ve already solved this challenge.
          </p>
        ) : open || archived ? (
          <SubmitForm challengeId={challenge.id} archived={archived} />
        ) : (
          <p className="text-slate-400">
            This challenge isn&apos;t open for submissions yet.
          </p>
        )}
      </section>
    </article>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ChallengeForm } from "@/components/challenge-form";
import { toISTInput, formatIST } from "@/lib/format";
import { computeEarnedSolves } from "@/lib/scoring";
import { deleteAttachment, deleteChallenge } from "@/lib/actions/admin";

export default async function EditChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const challenge = await db.challenge.findUnique({
    where: { id },
    include: { attachments: { orderBy: { createdAt: "asc" } } },
  });
  if (!challenge) notFound();

  // Solve log: who solved this challenge and when (oldest first), with the
  // points each solver locked in.
  const solveRows = await db.solve.findMany({
    where: { challengeId: id, user: { hidden: false } },
    orderBy: { solvedAt: "asc" },
    select: { userId: true, solvedAt: true, user: { select: { username: true } } },
  });
  const solves = computeEarnedSolves(
    solveRows.map((s) => ({
      userId: s.userId,
      username: s.user.username,
      challengeId: id,
      solvedAt: s.solvedAt,
    })),
    new Map([
      [
        id,
        {
          initialPoints: challenge.initialPoints,
          minPoints: challenge.minPoints,
          decay: challenge.decay,
          closeAt: challenge.closeAt,
        },
      ],
    ]),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/challenges"
          className="text-sm text-slate-400 hover:text-white"
        >
          ← Challenges
        </Link>
        <Link
          href={`/challenges/${challenge.id}`}
          className="text-sm text-accent hover:underline"
        >
          View as player →
        </Link>
      </div>

      <h1 className="text-xl font-bold text-white">
        Week {challenge.week}: {challenge.title}
      </h1>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Solve log ({solves.length})
        </h2>
        {solves.length === 0 ? (
          <p className="glass rounded-xl p-5 text-sm text-slate-400">
            No one has solved this challenge yet.
          </p>
        ) : (
          <div className="glass overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">#</th>
                  <th className="px-5 py-3 font-medium">Player</th>
                  <th className="px-5 py-3 font-medium">Solved at (IST)</th>
                  <th className="px-5 py-3 text-right font-medium">Points</th>
                </tr>
              </thead>
              <tbody>
                {solves.map((s) => (
                  <tr key={s.userId} className="border-t border-white/5">
                    <td className="px-5 py-3 font-mono text-slate-400">
                      {s.ordinal}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/u/${s.username}`}
                        className="font-medium text-white transition hover:text-accent"
                      >
                        {s.username}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {formatIST(s.solvedAt)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {s.archivedSolve ? (
                        <span className="text-amber-300">
                          0 <span className="text-xs text-slate-500">archived</span>
                        </span>
                      ) : (
                        <span className="font-semibold text-sky-300">{s.points}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {challenge.attachments.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Current files
          </h2>
          <ul className="space-y-2">
            {challenge.attachments.map((a) => (
              <li
                key={a.id}
                className="glass flex items-center justify-between rounded-xl px-4 py-2.5 text-sm"
              >
                <span className="font-mono text-sky-300">{a.originalName}</span>
                <form action={deleteAttachment}>
                  <input type="hidden" name="attachmentId" value={a.id} />
                  <button
                    type="submit"
                    className="text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ChallengeForm
        defaults={{
          id: challenge.id,
          week: challenge.week,
          title: challenge.title,
          category: challenge.category,
          volunteer: challenge.volunteer ?? undefined,
          description: challenge.description,
          published: challenge.published,
          releaseAtLocal: toISTInput(challenge.releaseAt),
          closeAtLocal: challenge.closeAt
            ? toISTInput(challenge.closeAt)
            : undefined,
          initialPoints: challenge.initialPoints,
          minPoints: challenge.minPoints,
          decay: challenge.decay,
          matchMode: challenge.matchMode,
        }}
      />

      <section className="rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-5">
        <h2 className="text-sm font-semibold text-red-400">Danger zone</h2>
        <p className="mt-1 text-xs text-slate-400">
          Deleting removes the challenge, its files, submissions and solves.
        </p>
        <form action={deleteChallenge} className="mt-3">
          <input type="hidden" name="challengeId" value={challenge.id} />
          <button
            type="submit"
            className="rounded-md border border-red-700 px-3 py-1.5 text-sm text-red-300 hover:bg-red-900/40"
          >
            Delete challenge
          </button>
        </form>
      </section>
    </div>
  );
}

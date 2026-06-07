import Link from "next/link";
import { db } from "@/lib/db";
import { currentValue } from "@/lib/scoring";
import { isReleased, isArchived } from "@/lib/challenges";
import { formatIST } from "@/lib/format";
import {
  setChallengePublished,
  setChallengeArchived,
  deleteChallenge,
} from "@/lib/actions/admin";
import DecryptedText from "@/components/DecryptedText";

const actionBtn =
  "rounded-lg border border-white/12 bg-white/5 px-2.5 py-1 text-xs text-slate-300 transition hover:bg-white/10";

export default async function AdminChallengesPage() {
  const challenges = await db.challenge.findMany({
    orderBy: { week: "desc" },
    include: { _count: { select: { solves: true } } },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white">Challenges</h1>
        <Link href="/admin/challenges/new" className="btn btn-primary btn-3d">
          <DecryptedText text="+ New" />
        </Link>
      </div>

      {challenges.length === 0 ? (
        <p className="glass rounded-2xl p-8 text-slate-400">No challenges yet.</p>
      ) : (
        <div className="glass overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3 font-medium">Week</th>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Schedule (IST)</th>
                <th className="px-5 py-3 text-right font-medium">Value</th>
                <th className="px-5 py-3 text-right font-medium">Solves</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {challenges.map((c) => {
                const released = isReleased(c);
                const archived = isArchived(c);
                return (
                  <tr
                    key={c.id}
                    className="border-t border-white/5 align-top transition hover:bg-white/[0.03]"
                  >
                    <td className="px-5 py-3 font-mono text-slate-400">{c.week}</td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/challenges/${c.id}`}
                        className="font-medium text-white transition hover:text-accent"
                      >
                        {c.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      {!c.published ? (
                        <span className="chip text-slate-400">Draft</span>
                      ) : archived ? (
                        <span className="chip border-amber-400/40 bg-amber-400/10 text-amber-300">
                          Archived
                        </span>
                      ) : !released ? (
                        <span className="chip border-sky-400/30 bg-sky-400/10 text-sky-300">
                          Scheduled
                        </span>
                      ) : (
                        <span className="chip border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                          Live
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">
                      <div>{formatIST(c.releaseAt)}</div>
                      {c.closeAt && (
                        <div className="text-slate-500">
                          closes {formatIST(c.closeAt)}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-sky-300">
                      {currentValue(c, c._count.solves)}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-300">
                      {c._count.solves}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Link
                          href={`/admin/challenges/${c.id}`}
                          className={actionBtn}
                        >
                          Edit
                        </Link>
                        <form action={setChallengePublished}>
                          <input type="hidden" name="challengeId" value={c.id} />
                          <input
                            type="hidden"
                            name="published"
                            value={c.published ? "false" : "true"}
                          />
                          <button type="submit" className={actionBtn}>
                            {c.published ? "Unpublish" : "Publish"}
                          </button>
                        </form>
                        <form action={setChallengeArchived}>
                          <input type="hidden" name="challengeId" value={c.id} />
                          <input
                            type="hidden"
                            name="archived"
                            value={archived ? "false" : "true"}
                          />
                          <button type="submit" className={actionBtn}>
                            {archived ? "Reopen" : "Archive"}
                          </button>
                        </form>
                        <form action={deleteChallenge}>
                          <input type="hidden" name="challengeId" value={c.id} />
                          <button
                            type="submit"
                            className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs text-red-300 transition hover:bg-red-500/20"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

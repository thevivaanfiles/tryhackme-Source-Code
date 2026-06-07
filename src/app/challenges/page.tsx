import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { listVisibleChallenges } from "@/lib/challenges";

export const metadata = { title: "Challenges" };

export default async function ChallengesPage() {
  const user = await getCurrentUser();
  const challenges = await listVisibleChallenges(user?.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Challenges
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          A new challenge drops every week. Point values shown live.
        </p>
      </div>

      {challenges.length === 0 ? (
        <p className="glass rounded-2xl p-8 text-slate-400">
          No challenges have been released yet.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {challenges.map((c) => (
            <li key={c.id}>
              <Link
                href={`/challenges/${c.id}`}
                className={`relative block overflow-hidden rounded-2xl p-5 ${
                  c.archived
                    ? "glass glass-hover opacity-90"
                    : c.volunteer
                      ? "glass-volunteer glass-volunteer-hover"
                      : "glass glass-hover"
                }`}
              >
                {c.archived ? (
                  <span className="pointer-events-none absolute -right-10 top-4 rotate-45 bg-amber-400/90 px-10 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-950">
                    Archived
                  </span>
                ) : (
                  c.volunteer && (
                    <span className="pointer-events-none absolute -right-10 top-4 rotate-45 bg-gradient-to-r from-indigo-500 to-purple-600 px-10 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-md shadow-indigo-500/10">
                      Volunteer
                    </span>
                  )
                )}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-accent">
                    Week {c.week}
                  </span>
                  <div className="flex gap-1.5">
                    {c.solved && (
                      <span className="chip border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                        ✓ Solved
                      </span>
                    )}
                  </div>
                </div>

                <h2 className="mt-3 text-lg font-semibold text-white">
                  {c.title}
                </h2>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="chip">{c.category}</span>
                    {c.volunteer && (
                      <>
                        <span className="text-slate-600 text-xs font-bold">•</span>
                        <span className="text-xs text-indigo-400 font-medium">
                          by {c.volunteer}
                        </span>
                      </>
                    )}
                  </div>
                  {c.archived ? (
                    <span className="text-slate-400">
                      <span className="text-slate-500 line-through">{c.worth} pts</span>{" "}
                      <span className="font-semibold text-amber-300">0 earned</span> ·{" "}
                      {c.solveCount} solves
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      <span className="font-semibold text-sky-300">{c.worth}</span> pts
                      · {c.solveCount} solves
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

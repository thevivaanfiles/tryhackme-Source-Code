import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  buildLeaderboard,
  computeEarnedSolves,
  currentValue,
  type EarnedSolve,
  type ChallengeScore,
} from "@/lib/scoring";
import { isArchived } from "@/lib/challenges";
import { formatDate } from "@/lib/format";
import { resolveWindow, type RangeKey } from "@/lib/timeframe";
import { LeaderboardControls } from "./controls";

export const metadata = { title: "Leaderboard" };

const medal = ["🥇", "🥈", "🥉"];

type SearchParams = {
  view?: string;
  range?: string;
  from?: string;
  to?: string;
  challenge?: string;
};

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const view = sp.view === "challenge" ? "challenge" : "players";

  const [user, challenges, solves] = await Promise.all([
    getCurrentUser(),
    db.challenge.findMany({
      orderBy: { week: "desc" },
      select: {
        id: true,
        week: true,
        title: true,
        initialPoints: true,
        minPoints: true,
        decay: true,
        releaseAt: true,
        closeAt: true,
        published: true,
        _count: { select: { solves: { where: { user: { hidden: false } } } } },
      },
    }),
    db.solve.findMany({
      where: { user: { hidden: false } },
      select: {
        userId: true,
        challengeId: true,
        solvedAt: true,
        user: { select: { username: true } },
      },
    }),
  ]);

  const configs = new Map<string, ChallengeScore>(
    challenges.map((c) => [
      c.id,
      {
        initialPoints: c.initialPoints,
        minPoints: c.minPoints,
        decay: c.decay,
        closeAt: c.closeAt,
      },
    ]),
  );

  // Points each solver locked in (decays with solve order), computed once.
  const earned = computeEarnedSolves(
    solves.map((s) => ({
      userId: s.userId,
      username: s.user.username,
      challengeId: s.challengeId,
      solvedAt: s.solvedAt,
    })),
    configs,
  );

  const challengeOpts = challenges.map((c) => ({
    id: c.id,
    week: c.week,
    title: c.title,
  }));
  const selectedChallenge = sp.challenge ?? challengeOpts[0]?.id ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Leaderboard
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Points are locked in at solve time — solve early, score higher. Slice by
          timeframe or drill into a single challenge.
        </p>
      </div>

      <LeaderboardControls
        view={view}
        range={(sp.range as RangeKey) ?? "all"}
        from={sp.from ?? ""}
        to={sp.to ?? ""}
        challengeId={selectedChallenge}
        challenges={challengeOpts}
      />

      {view === "players" ? (
        <PlayersBoard
          earned={earned}
          range={sp.range}
          from={sp.from}
          to={sp.to}
          meId={user?.id}
        />
      ) : (
        <ChallengeBoard
          earned={earned}
          challenges={challenges}
          challengeId={selectedChallenge}
          meId={user?.id}
        />
      )}
    </div>
  );
}

function PlayersBoard({
  earned,
  range,
  from,
  to,
  meId,
}: {
  earned: EarnedSolve[];
  range?: string;
  from?: string;
  to?: string;
  meId?: string;
}) {
  const win = resolveWindow(range, from, to);
  const inWindow = earned.filter((s) => {
    if (win.start && s.solvedAt < win.start) return false;
    if (win.end && s.solvedAt > win.end) return false;
    return true;
  });

  const rows = buildLeaderboard(inWindow);

  return (
    <>
      <p className="text-xs uppercase tracking-widest text-slate-500">
        Showing: <span className="text-slate-300">{win.label}</span>
      </p>
      {rows.length === 0 ? (
        <p className="glass rounded-2xl p-8 text-slate-400">
          No solves in this timeframe.
        </p>
      ) : (
        <div className="glass overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[440px] text-sm">
            <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-3 py-3 font-medium sm:px-5">Rank</th>
                <th className="px-3 py-3 font-medium sm:px-5">Player</th>
                <th className="px-3 py-3 text-right font-medium sm:px-5">Solves</th>
                <th className="px-3 py-3 text-right font-medium sm:px-5">Score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isMe = meId === r.userId;
                return (
                  <tr
                    key={r.userId}
                    className={`border-t border-white/5 transition hover:bg-white/[0.03] ${
                      isMe ? "bg-sky-400/[0.07]" : ""
                    }`}
                  >
                    <td className="px-3 py-3 font-mono text-slate-400 sm:px-5">
                      {r.rank <= 3 ? (
                        <span className="text-base">{medal[r.rank - 1]}</span>
                      ) : (
                        r.rank
                      )}
                    </td>
                    <td className="px-3 py-3 font-medium text-white sm:px-5">
                      <Link
                        href={`/u/${r.username}`}
                        className="transition hover:text-accent"
                      >
                        {r.username}
                      </Link>
                      {isMe && <span className="ml-2 text-xs text-accent">(you)</span>}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-300 sm:px-5">
                      {r.solveCount}
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-sky-300 sm:px-5">
                      {r.score}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function ChallengeBoard({
  earned,
  challenges,
  challengeId,
  meId,
}: {
  earned: EarnedSolve[];
  challenges: {
    id: string;
    week: number;
    title: string;
    initialPoints: number;
    minPoints: number;
    decay: number;
    releaseAt: Date;
    closeAt: Date | null;
    published: boolean;
    _count: { solves: number };
  }[];
  challengeId: string;
  meId?: string;
}) {
  const challenge = challenges.find((c) => c.id === challengeId);
  if (!challenge) {
    return (
      <p className="glass rounded-2xl p-8 text-slate-400">
        No challenges to show yet.
      </p>
    );
  }

  // Solvers ranked by points earned (desc) — which equals solve order, so the
  // decaying values read top-to-bottom.
  const rows = earned
    .filter((s) => s.challengeId === challengeId)
    .sort((a, b) => b.points - a.points || a.solvedAt.getTime() - b.solvedAt.getTime());

  const archived = isArchived(challenge);
  const nextValue = currentValue(challenge, challenge._count.solves);

  return (
    <>
      <p className="text-xs uppercase tracking-widest text-slate-500">
        Week {challenge.week} ·{" "}
        <span className="text-slate-300">{challenge.title}</span> ·{" "}
        {archived ? (
          <span className="text-amber-300">archived · earns 0 pts</span>
        ) : (
          <>
            next solver earns <span className="text-sky-300">{nextValue} pts</span>
          </>
        )}
      </p>
      {rows.length === 0 ? (
        <p className="glass rounded-2xl p-8 text-slate-400">
          No one has solved this challenge yet.
        </p>
      ) : (
        <div className="glass overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-3 py-3 font-medium sm:px-5">Rank</th>
                <th className="px-3 py-3 font-medium sm:px-5">Player</th>
                <th className="px-3 py-3 font-medium sm:px-5">Solved</th>
                <th className="px-3 py-3 text-right font-medium sm:px-5">Points</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s, i) => {
                const isMe = meId === s.userId;
                return (
                  <tr
                    key={s.userId}
                    className={`border-t border-white/5 transition hover:bg-white/[0.03] ${
                      isMe ? "bg-sky-400/[0.07]" : ""
                    }`}
                  >
                    <td className="px-3 py-3 font-mono text-slate-400 sm:px-5">
                      {i < 3 ? <span className="text-base">{medal[i]}</span> : i + 1}
                    </td>
                    <td className="px-3 py-3 font-medium text-white sm:px-5">
                      <Link
                        href={`/u/${s.username}`}
                        className="transition hover:text-accent"
                      >
                        {s.username}
                      </Link>
                      {s.ordinal === 1 && (
                        <span className="ml-2 text-xs text-amber-300">first blood</span>
                      )}
                      {isMe && <span className="ml-2 text-xs text-accent">(you)</span>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-400 sm:px-5">
                      {formatDate(s.solvedAt)}
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-sky-300 sm:px-5">
                      {s.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { RANGE_PRESETS, type RangeKey } from "@/lib/timeframe";

type ChallengeOpt = { id: string; week: number; title: string };

export function LeaderboardControls({
  view,
  range,
  from,
  to,
  challengeId,
  challenges,
}: {
  view: "players" | "challenge";
  range: RangeKey;
  from: string;
  to: string;
  challengeId: string;
  challenges: ChallengeOpt[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  function push(next: Record<string, string | undefined>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    router.push(`/leaderboard?${sp.toString()}`);
  }

  const tabCls = (active: boolean) =>
    `rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
      active ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
    }`;

  return (
    <div className="glass space-y-4 rounded-2xl p-4">
      {/* View tabs */}
      <div className="flex gap-1">
        <button
          className={tabCls(view === "players")}
          onClick={() => push({ view: "players" })}
        >
          Players
        </button>
        <button
          className={tabCls(view === "challenge")}
          onClick={() => push({ view: "challenge" })}
        >
          By challenge
        </button>
      </div>

      {view === "players" ? (
        <div className="flex flex-wrap items-center gap-2">
          {RANGE_PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => push({ view: "players", range: p.key })}
              className={`chip transition ${
                range === p.key
                  ? "border-sky-400/50 bg-sky-400/15 text-sky-200"
                  : "hover:border-white/25"
              }`}
            >
              {p.label}
            </button>
          ))}

          {range === "custom" && (
            <div className="flex flex-wrap items-center gap-2 pl-1">
              <input
                type="date"
                defaultValue={from}
                onChange={(e) =>
                  push({ view: "players", range: "custom", from: e.target.value })
                }
                className="field w-auto py-1"
                aria-label="From date"
              />
              <span className="text-slate-500">→</span>
              <input
                type="date"
                defaultValue={to}
                onChange={(e) =>
                  push({ view: "players", range: "custom", to: e.target.value })
                }
                className="field w-auto py-1"
                aria-label="To date"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Challenge</label>
          <select
            value={challengeId}
            onChange={(e) => push({ view: "challenge", challenge: e.target.value })}
            className="field w-auto"
          >
            {challenges.length === 0 && <option value="">No challenges yet</option>}
            {challenges.map((c) => (
              <option key={c.id} value={c.id}>
                Week {c.week} — {c.title}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

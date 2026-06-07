import Link from "next/link";
import type { SolvedEntry } from "@/lib/profile-stats";
import { formatDate } from "@/lib/format";

export function SolvedList({
  scored,
  emptyText,
}: {
  scored: SolvedEntry[];
  emptyText: React.ReactNode;
}) {
  if (scored.length === 0) {
    return <p className="glass rounded-2xl p-8 text-slate-400">{emptyText}</p>;
  }

  return (
    <ul className="space-y-2">
      {scored.map((s) => (
        <li
          key={s.challengeId}
          className="glass glass-hover flex items-center justify-between gap-3 rounded-xl px-4 py-3.5 sm:px-5"
        >
          <div className="min-w-0">
            <Link
              href={`/challenges/${s.challengeId}`}
              className="font-medium text-white transition hover:text-accent"
            >
              {s.title}
            </Link>
            <p className="text-xs text-slate-500">
              Week {s.week} · {formatDate(s.solvedAt)}
            </p>
          </div>
          <span className="whitespace-nowrap font-bold text-sky-300">
            {s.points} pts
          </span>
        </li>
      ))}
    </ul>
  );
}

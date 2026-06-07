import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import DecryptedText from "@/components/DecryptedText";
import cclogo from "../../public/cclogo.png";

export default async function HomePage() {
  const [user, latest, userCount, solveCount] = await Promise.all([
    getCurrentUser(),
    db.challenge.findFirst({
      where: { published: true, releaseAt: { lte: new Date() } },
      orderBy: { week: "desc" },
      include: {
        _count: { select: { solves: { where: { user: { hidden: false } } } } },
      },
    }),
    db.user.count({ where: { hidden: false } }),
    db.solve.count({ where: { user: { hidden: false } } }),
  ]);

  return (
    <div className="space-y-16">
      <section className="relative flex flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-sky-500/20 blur-3xl" />
          <Image
            src={cclogo}
            alt="Coding Club"
            priority
            className="h-28 w-auto sm:h-32"
            style={{ height: "8rem", width: "auto" }}
          />
        </div>

        <span className="chip shimmer font-mono uppercase tracking-widest">
          weekly · tryhackme
        </span>

        <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
          One challenge. <span className="gradient-text">Every week.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-balance text-slate-400">
          A fresh challenge drops every week, break it, submit the flag, and
          climb the leaderboard. Every solve after the first is worth less, so the
          fastest crackers score highest.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {user ? (
            <Link href="/challenges" className="btn btn-primary btn-3d">
              <DecryptedText text="Go to challenges" />
            </Link>
          ) : (
            <>
              <Link href="/register" className="btn btn-primary btn-3d">
                <DecryptedText text="Get started" />
              </Link>
              <Link href="/leaderboard" className="btn btn-ghost btn-3d">
                <DecryptedText text="View leaderboard" />
              </Link>
            </>
          )}
        </div>

        <div className="mt-10 flex items-center gap-8 text-center">
          <Stat value={userCount} label="players" />
          <div className="h-8 w-px bg-white/10" />
          <Stat value={solveCount} label="solves" />
        </div>
      </section>

      <section className="glass glass-hover relative overflow-hidden rounded-2xl p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            This week
          </h2>
          {latest && (
            <span className="chip text-accent">Week {latest.week}</span>
          )}
        </div>

        {latest ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-2xl font-bold text-white">{latest.title}</p>
              <p className="mt-1 text-sm text-slate-400">
                <span className="chip mr-2">{latest.category}</span>
                {latest._count.solves} solves so far
              </p>
            </div>
            <Link
              href={`/challenges/${latest.id}`}
              className="btn btn-primary btn-3d"
            >
              <DecryptedText text="Open challenge" />
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        ) : (
          <p className="mt-4 text-slate-400">
            No challenge has been released yet. Check back soon!
          </p>
        )}
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
    </div>
  );
}

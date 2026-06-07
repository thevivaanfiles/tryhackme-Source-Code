import { db } from "@/lib/db";
import { computeEarnedSolves, type ChallengeScore } from "@/lib/scoring";

export type SolvedEntry = {
  challengeId: string;
  week: number;
  title: string;
  solvedAt: Date;
  points: number;
};

// Returns a user's solved challenges with the points they locked in (value at
// solve time) and the running total. Shared by the private and public profiles.
export async function getSolvedWithPoints(
  userId: string,
): Promise<{ scored: SolvedEntry[]; total: number }> {
  const solves = await db.solve.findMany({
    where: { userId },
    orderBy: { solvedAt: "desc" },
    select: {
      solvedAt: true,
      challenge: {
        select: {
          id: true,
          week: true,
          title: true,
          initialPoints: true,
          minPoints: true,
          decay: true,
          closeAt: true,
        },
      },
    },
  });

  if (solves.length === 0) return { scored: [], total: 0 };

  // Points depend on each challenge's full solve order, so pull every solve for
  // the solved challenges and compute ordinals globally.
  const challengeIds = solves.map((s) => s.challenge.id);
  const allSolves = await db.solve.findMany({
    where: { challengeId: { in: challengeIds }, user: { hidden: false } },
    select: { userId: true, challengeId: true, solvedAt: true },
  });

  const configs = new Map<string, ChallengeScore>(
    solves.map((s) => [
      s.challenge.id,
      {
        initialPoints: s.challenge.initialPoints,
        minPoints: s.challenge.minPoints,
        decay: s.challenge.decay,
        closeAt: s.challenge.closeAt,
      },
    ]),
  );

  const pointsByChallenge = new Map(
    computeEarnedSolves(
      allSolves.map((s) => ({ ...s, username: "" })),
      configs,
    )
      .filter((e) => e.userId === userId)
      .map((e) => [e.challengeId, e.points]),
  );

  const scored: SolvedEntry[] = solves.map((s) => ({
    challengeId: s.challenge.id,
    week: s.challenge.week,
    title: s.challenge.title,
    solvedAt: s.solvedAt,
    points: pointsByChallenge.get(s.challenge.id) ?? 0,
  }));

  const total = scored.reduce((sum, s) => sum + s.points, 0);
  return { scored, total };
}

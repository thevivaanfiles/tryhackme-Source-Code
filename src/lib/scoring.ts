// Dynamic decaying score (CTFd-style): a challenge is worth fewer points the
// more people solve it. With `solveCount` solves already recorded, the value
// available to the NEXT solver is:
//
//   value = ceil( ((min - init) / decay^2) * solveCount^2 + init )  clamped to >= min
//
// At 0 prior solves the value equals `initialPoints` (so the first solver — a
// "first blood" — earns the full points) and it decays toward `minPoints`.

export type ScoreConfig = {
  initialPoints: number;
  minPoints: number;
  decay: number;
};

export function currentValue(config: ScoreConfig, solveCount: number): number {
  const { initialPoints, minPoints, decay } = config;
  if (solveCount <= 0) return initialPoints;
  const raw =
    ((minPoints - initialPoints) / (decay * decay)) * (solveCount * solveCount) +
    initialPoints;
  return Math.max(minPoints, Math.ceil(raw));
}

// Points the solver at a given 1-based position earned, locked in at solve time.
// The 1st solver earns the full initial value; the Nth solver earns the value
// after (N-1) prior solves. Earlier solvers keep more as the challenge decays.
export function pointsForOrdinal(config: ScoreConfig, ordinal: number): number {
  return currentValue(config, Math.max(0, ordinal - 1));
}

export type LeaderboardRow = {
  rank: number;
  userId: string;
  username: string;
  score: number;
  solveCount: number;
  lastSolveAt: Date | null;
};

type SolveInput = {
  userId: string;
  username: string;
  challengeId: string;
  solvedAt: Date;
};

// Score config plus the challenge's close time. Solves recorded after `closeAt`
// (i.e. while the challenge is archived) earn nothing.
export type ChallengeScore = ScoreConfig & { closeAt?: Date | null };

export type EarnedSolve = SolveInput & {
  ordinal: number; // 1-based solve position on its challenge (global order)
  points: number; // points locked in at solve time (0 if solved while archived)
  archivedSolve: boolean; // solved after the challenge closed
};

// Assigns each solve the points it earned using value-at-solve-time: solves are
// ordered per challenge by time, and the Nth solver locks in
// pointsForOrdinal(config, N). Solves made after `closeAt` earn 0 (archived
// practice solves). Pass ALL solves (unfiltered) so ordinals reflect the true
// global order; callers can filter the result by timeframe afterwards.
export function computeEarnedSolves(
  solves: SolveInput[],
  configs: Map<string, ChallengeScore>,
): EarnedSolve[] {
  const byChallenge = new Map<string, SolveInput[]>();
  for (const s of solves) {
    const list = byChallenge.get(s.challengeId);
    if (list) list.push(s);
    else byChallenge.set(s.challengeId, [s]);
  }

  const earned: EarnedSolve[] = [];
  for (const [challengeId, list] of byChallenge) {
    const config = configs.get(challengeId);
    list.sort((a, b) => a.solvedAt.getTime() - b.solvedAt.getTime());
    list.forEach((s, i) => {
      const ordinal = i + 1;
      const archivedSolve =
        !!config?.closeAt && s.solvedAt.getTime() > config.closeAt.getTime();
      earned.push({
        ...s,
        ordinal,
        archivedSolve,
        points: !config || archivedSolve ? 0 : pointsForOrdinal(config, ordinal),
      });
    });
  }
  return earned;
}

// Builds a ranked leaderboard from a set of earned solves (already filtered to
// the desired timeframe). Each solve contributes its locked-in points. Ties are
// broken by who reached their score first.
export function buildLeaderboard(earned: EarnedSolve[]): LeaderboardRow[] {
  const byUser = new Map<
    string,
    { username: string; score: number; solveCount: number; lastSolveAt: Date }
  >();

  for (const s of earned) {
    const entry = byUser.get(s.userId) ?? {
      username: s.username,
      score: 0,
      solveCount: 0,
      lastSolveAt: s.solvedAt,
    };
    entry.score += s.points;
    entry.solveCount += 1;
    if (s.solvedAt > entry.lastSolveAt) entry.lastSolveAt = s.solvedAt;
    byUser.set(s.userId, entry);
  }

  return [...byUser.entries()]
    .map(([userId, e]) => ({
      userId,
      username: e.username,
      score: e.score,
      solveCount: e.solveCount,
      lastSolveAt: e.lastSolveAt,
    }))
    .sort((a, b) =>
      b.score - a.score ||
      a.lastSolveAt.getTime() - b.lastSolveAt.getTime() ||
      a.username.localeCompare(b.username),
    )
    .map((row, i) => ({ rank: i + 1, ...row }));
}

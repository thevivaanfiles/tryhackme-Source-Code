import { db } from "@/lib/db";
import { currentValue } from "@/lib/scoring";

type ChallengeTimes = {
  published: boolean;
  releaseAt: Date;
  closeAt: Date | null;
};

export function isReleased(c: ChallengeTimes, now = new Date()): boolean {
  return c.published && c.releaseAt.getTime() <= now.getTime();
}

export function isOpen(c: ChallengeTimes, now = new Date()): boolean {
  return isReleased(c, now) && (!c.closeAt || c.closeAt.getTime() > now.getTime());
}

// A released challenge whose close time has passed: still solvable for practice,
// but it no longer awards points.
export function isArchived(c: ChallengeTimes, now = new Date()): boolean {
  return isReleased(c, now) && !!c.closeAt && c.closeAt.getTime() <= now.getTime();
}

// Public-facing list of released challenges with live value + solve counts,
// and (if a user is given) whether they've solved each.
export async function listVisibleChallenges(userId?: string) {
  const challenges = await db.challenge.findMany({
    where: { published: true, releaseAt: { lte: new Date() } },
    orderBy: { week: "desc" },
    select: {
      id: true,
      week: true,
      title: true,
      category: true,
      volunteer: true,
      releaseAt: true,
      closeAt: true,
      published: true,
      initialPoints: true,
      minPoints: true,
      decay: true,
      _count: { select: { solves: { where: { user: { hidden: false } } } } },
      ...(userId
        ? { solves: { where: { userId }, select: { id: true }, take: 1 } }
        : {}),
    },
  });

  return challenges.map((c) => {
    const archived = isArchived(c);
    return {
      id: c.id,
      week: c.week,
      title: c.title,
      category: c.category,
      volunteer: c.volunteer,
      archived,
      solveCount: c._count.solves,
      // Live value for active challenges; for archived ones we surface the
      // original (max) worth since solving now earns nothing.
      worth: archived ? c.initialPoints : currentValue(c, c._count.solves),
      solved: "solves" in c ? (c.solves as { id: string }[]).length > 0 : false,
    };
  });
}

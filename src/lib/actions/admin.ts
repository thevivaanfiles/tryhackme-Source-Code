"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { challengeSchema } from "@/lib/validation";
import { prepareFlagData } from "@/lib/flag";
import { saveUpload, deleteUpload } from "@/lib/storage";
import { fromISTInput } from "@/lib/format";

export type FormState = { error?: string } | undefined;

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB per file

// Create or update a challenge, including any newly uploaded attachments.
export async function saveChallenge(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = (formData.get("id") as string) || null;

  const parsed = challengeSchema.safeParse({
    week: formData.get("week"),
    title: formData.get("title"),
    category: formData.get("category") || "misc",
    volunteer: formData.get("volunteer") || undefined,
    description: formData.get("description") || "",
    published: formData.get("published") === "on",
    releaseAt: formData.get("releaseAt"),
    closeAt: formData.get("closeAt") || undefined,
    initialPoints: formData.get("initialPoints"),
    minPoints: formData.get("minPoints"),
    decay: formData.get("decay"),
    matchMode: formData.get("matchMode"),
    flag: formData.get("flag") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const d = parsed.data;

  if (d.minPoints > d.initialPoints) {
    return { error: "Minimum points cannot exceed initial points." };
  }

  // Schedule times are entered in IST.
  const releaseAt = fromISTInput(d.releaseAt);
  if (!releaseAt) return { error: "Invalid release time." };
  let closeAt: Date | null = null;
  if (d.closeAt && d.closeAt.trim()) {
    closeAt = fromISTInput(d.closeAt);
    if (!closeAt) return { error: "Invalid close time." };
    if (closeAt.getTime() <= releaseAt.getTime()) {
      return { error: "Close time must be after the release time." };
    }
  }

  const existing = id
    ? await db.challenge.findUnique({
        where: { id },
        select: { matchMode: true },
      })
    : null;
  if (id && !existing) return { error: "Challenge not found." };

  // Decide the flag data to store.
  let flagData: string | undefined;
  const flagProvided = d.flag.trim().length > 0;
  const modeChanged = existing ? existing.matchMode !== d.matchMode : true;

  if (!id || flagProvided || modeChanged) {
    if (!flagProvided) {
      return {
        error: id
          ? "Enter the flag (required when changing the match mode)."
          : "A flag is required.",
      };
    }
    try {
      flagData = await prepareFlagData(d.matchMode, d.flag);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Invalid flag input." };
    }
  }

  const base = {
    week: d.week,
    title: d.title,
    category: d.category,
    volunteer: d.volunteer || null,
    description: d.description,
    published: d.published,
    releaseAt,
    closeAt,
    initialPoints: d.initialPoints,
    minPoints: d.minPoints,
    decay: d.decay,
    matchMode: d.matchMode,
  };

  let challengeId: string;
  try {
    if (id) {
      await db.challenge.update({
        where: { id },
        data: { ...base, ...(flagData ? { flagData } : {}) },
      });
      challengeId = id;
    } else {
      const created = await db.challenge.create({
        data: { ...base, flagData: flagData! },
      });
      challengeId = created.id;
    }
  } catch (e: unknown) {
    if (typeof e === "object" && e && "code" in e && e.code === "P2002") {
      return { error: `Week ${d.week} already has a challenge.` };
    }
    throw e;
  }

  // Save any uploaded files.
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  for (const file of files) {
    if (file.size === 0) continue;
    if (file.size > MAX_FILE_BYTES) {
      return { error: `"${file.name}" exceeds the 50 MB limit.` };
    }
    const saved = await saveUpload(file);
    await db.attachment.create({
      data: {
        challengeId,
        originalName: file.name,
        storedName: saved.storedName,
        mimeType: file.type || "application/octet-stream",
        size: saved.size,
      },
    });
  }

  revalidatePath("/admin/challenges");
  revalidatePath("/challenges");
  redirect(`/admin/challenges/${challengeId}`);
}

export async function deleteAttachment(formData: FormData) {
  await requireAdmin();
  const id = formData.get("attachmentId") as string;
  if (!id) return;
  const attachment = await db.attachment.findUnique({ where: { id } });
  if (!attachment) return;
  await deleteUpload(attachment.storedName);
  await db.attachment.delete({ where: { id } });
  revalidatePath(`/admin/challenges/${attachment.challengeId}`);
}

export async function deleteChallenge(formData: FormData) {
  await requireAdmin();
  const id = formData.get("challengeId") as string;
  if (!id) return;
  const attachments = await db.attachment.findMany({
    where: { challengeId: id },
    select: { storedName: true },
  });
  await Promise.all(attachments.map((a) => deleteUpload(a.storedName)));
  await db.challenge.delete({ where: { id } });
  revalidatePath("/admin/challenges");
  revalidatePath("/challenges");
  redirect("/admin/challenges");
}

// Quick publish/unpublish toggle from the challenges list.
export async function setChallengePublished(formData: FormData) {
  await requireAdmin();
  const id = formData.get("challengeId") as string;
  const published = formData.get("published") === "true";
  if (!id) return;
  await db.challenge.update({ where: { id }, data: { published } });
  revalidatePath("/admin/challenges");
  revalidatePath("/challenges");
}

// Manually archive (close now) or reopen a challenge. Archiving sets closeAt to
// now so it stops awarding points; reopening clears closeAt.
export async function setChallengeArchived(formData: FormData) {
  await requireAdmin();
  const id = formData.get("challengeId") as string;
  const archived = formData.get("archived") === "true";
  if (!id) return;
  await db.challenge.update({
    where: { id },
    data: { closeAt: archived ? new Date() : null },
  });
  revalidatePath("/admin/challenges");
  revalidatePath("/challenges");
}

// Ghost a user: hidden users are excluded from counts, the leaderboard, public
// profiles, and all solve tallies/decay (but the row remains, so it's reversible).
export async function setUserHidden(formData: FormData) {
  const admin = await requireAdmin();
  const userId = formData.get("userId") as string;
  const hidden = formData.get("hidden") === "true";
  if (!userId || userId === admin.id) return; // can't hide yourself
  await db.user.update({ where: { id: userId }, data: { hidden } });
  revalidatePath("/admin/users");
  revalidatePath("/leaderboard");
  revalidatePath("/challenges");
  revalidatePath("/");
}

// Manually mark a user's email verified (or revoke it).
export async function setUserVerified(formData: FormData) {
  await requireAdmin();
  const userId = formData.get("userId") as string;
  const verified = formData.get("verified") === "true";
  if (!userId) return;
  await db.user.update({
    where: { id: userId },
    data: { emailVerified: verified ? new Date() : null },
  });
  revalidatePath("/admin/users");
}

export async function deleteUser(formData: FormData) {
  const admin = await requireAdmin();
  const userId = formData.get("userId") as string;
  if (!userId || userId === admin.id) return; // can't delete yourself
  // Solves & submissions cascade via the schema's onDelete: Cascade.
  await db.user.delete({ where: { id: userId } });
  revalidatePath("/admin/users");
}

export async function setUserRole(formData: FormData) {
  const admin = await requireAdmin();
  const userId = formData.get("userId") as string;
  const role = formData.get("role") === "ADMIN" ? "ADMIN" : "USER";
  if (!userId || userId === admin.id) return; // can't change your own role
  await db.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
}

export async function setUserDisabled(formData: FormData) {
  const admin = await requireAdmin();
  const userId = formData.get("userId") as string;
  const disabled = formData.get("disabled") === "true";
  if (!userId || userId === admin.id) return; // can't disable yourself
  await db.user.update({ where: { id: userId }, data: { disabled } });
  revalidatePath("/admin/users");
}

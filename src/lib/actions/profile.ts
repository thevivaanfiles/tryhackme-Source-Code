"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { profileSchema } from "@/lib/validation";
import { saveUpload, deleteUpload } from "@/lib/storage";
import { isEnvAdmin } from "@/lib/admin";

export type FormState = { error?: string } | undefined;

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export async function updateProfile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  if (isEnvAdmin(user)) return { error: "The default admin has no profile." };

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    usn: formData.get("usn"),
    year: formData.get("year"),
    branch: formData.get("branch"),
    bio: formData.get("bio") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { name, usn, year, branch, bio } = parsed.data;

  // USN must stay unique across other accounts.
  const clash = await db.user.findFirst({
    where: { usn, NOT: { id: user.id } },
    select: { id: true },
  });
  if (clash) return { error: "That USN is already registered to another account." };

  // Optional avatar upload.
  const file = formData.get("avatar");
  let avatarPath: string | undefined;
  let previousAvatar: string | null = null;

  if (file instanceof File && file.size > 0) {
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      return { error: "Avatar must be a PNG, JPEG, WebP, or GIF image." };
    }
    if (file.size > MAX_AVATAR_BYTES) {
      return { error: "Avatar must be 5 MB or smaller." };
    }
    const current = await db.user.findUnique({
      where: { id: user.id },
      select: { avatarPath: true },
    });
    previousAvatar = current?.avatarPath ?? null;
    const saved = await saveUpload(file);
    avatarPath = saved.storedName;
  }

  await db.user.update({
    where: { id: user.id },
    data: { name, usn, year, branch, bio, ...(avatarPath ? { avatarPath } : {}) },
  });

  // Remove the old avatar file once the new one is committed.
  if (avatarPath && previousAvatar) {
    await deleteUpload(previousAvatar);
  }

  revalidatePath("/profile");
  revalidatePath(`/u/${user.username}`);
  redirect("/profile");
}

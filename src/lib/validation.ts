import { z } from "zod";
import { BRANCHES, USN_REGEX, YEAR_VALUES, normalizeUsn } from "@/lib/profile";

// Profile fields shared by registration and the edit-profile form.
const nameField = z.string().trim().min(1, "Name is required").max(80);
const usnField = z
  .string()
  .trim()
  .regex(USN_REGEX, "USN must look like 1RV or 1RZ followed by 7 characters")
  .transform(normalizeUsn);
const yearField = z.enum(YEAR_VALUES, { message: "Select your year" });
const branchField = z.enum(BRANCHES, { message: "Select your branch" });

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(32, "Username must be at most 32 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Use only letters, numbers, _ and -"),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  name: nameField,
  usn: usnField,
  year: yearField,
  branch: branchField,
});

export const profileSchema = z.object({
  name: nameField,
  usn: usnField,
  year: yearField,
  branch: branchField,
  bio: z.string().trim().max(500, "Bio must be at most 500 characters").default(""),
});

export const matchModes = ["EXACT_CS", "EXACT_CI", "REGEX", "MULTI"] as const;

export const challengeSchema = z.object({
  week: z.coerce.number().int().min(1, "Week must be >= 1"),
  title: z.string().min(1, "Title is required").max(200),
  category: z.string().min(1).max(60).default("misc"),
  volunteer: z.string().max(100).optional().or(z.literal("")),
  description: z.string().max(20000).default(""),
  published: z.coerce.boolean().default(false),
  // Raw "YYYY-MM-DDTHH:mm" values entered in IST; converted to Date in the action.
  releaseAt: z.string().min(1, "Release time is required"),
  closeAt: z.string().optional(),
  initialPoints: z.coerce.number().int().min(1).max(100000),
  minPoints: z.coerce.number().int().min(1).max(100000),
  decay: z.coerce.number().int().min(1).max(100000),
  matchMode: z.enum(matchModes),
  // Raw flag input from the admin form: a single flag, a regex, or
  // newline/JSON separated list for MULTI. Empty = keep existing flag on edit.
  flag: z.string().max(5000).default(""),
});

export const submitSchema = z.object({
  challengeId: z.string().min(1),
  value: z.string().min(1, "Enter a flag").max(2000),
});

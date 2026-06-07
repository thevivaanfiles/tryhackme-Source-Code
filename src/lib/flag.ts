import bcrypt from "bcryptjs";
import type { MatchMode } from "@/generated/prisma/client";

// All flag comparison logic lives server-side. `flagData` stored on a challenge
// holds different things per mode:
//   EXACT_CS  -> bcrypt hash of the raw flag
//   EXACT_CI  -> bcrypt hash of the normalized (trim + lowercase) flag
//   REGEX     -> the regular expression source (plaintext)
//   MULTI     -> JSON array of accepted plaintext answers

const normalize = (s: string) => s.trim().toLowerCase();

export function parseMultiAnswers(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  // Accept either a JSON array or one answer per line.
  if (trimmed.startsWith("[")) {
    try {
      const arr = JSON.parse(trimmed);
      if (Array.isArray(arr)) return arr.map(String).map((s) => s.trim()).filter(Boolean);
    } catch {
      /* fall through to line parsing */
    }
  }
  return trimmed
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Validates and transforms admin flag input into the value stored in the DB.
export async function prepareFlagData(mode: MatchMode, raw: string): Promise<string> {
  const value = raw ?? "";
  switch (mode) {
    case "EXACT_CS":
      return bcrypt.hash(value, 10);
    case "EXACT_CI":
      return bcrypt.hash(normalize(value), 10);
    case "REGEX":
      // Throws if the pattern is invalid.
      new RegExp(value);
      return value;
    case "MULTI": {
      const answers = parseMultiAnswers(value);
      if (answers.length === 0) throw new Error("Provide at least one accepted answer.");
      return JSON.stringify(answers);
    }
    default:
      throw new Error("Unknown match mode");
  }
}

// Returns true if `submitted` is a correct flag for the given stored data.
export async function checkFlag(
  mode: MatchMode,
  flagData: string,
  submitted: string,
): Promise<boolean> {
  const value = submitted ?? "";
  switch (mode) {
    case "EXACT_CS":
      return bcrypt.compare(value, flagData);
    case "EXACT_CI":
      return bcrypt.compare(normalize(value), flagData);
    case "REGEX":
      try {
        return new RegExp(flagData).test(value);
      } catch {
        return false;
      }
    case "MULTI": {
      let answers: string[] = [];
      try {
        answers = JSON.parse(flagData);
      } catch {
        return false;
      }
      return answers.includes(value.trim());
    }
    default:
      return false;
  }
}

export const MATCH_MODE_LABELS: Record<MatchMode, string> = {
  EXACT_CS: "Exact match (case-sensitive)",
  EXACT_CI: "Exact match (case-insensitive)",
  REGEX: "Regular expression",
  MULTI: "Multiple accepted answers",
};

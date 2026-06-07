// Single source of truth for profile dropdowns, labels, and the USN rule —
// reused by the zod schemas, the forms, and the display pages.

export const BRANCHES = [
  "ASE",
  "BT",
  "CH",
  "CV",
  "CSE",
  "AIML",
  "CY",
  "CD",
  "EEE",
  "ECE",
  "EIE",
  "IEM",
  "ISE",
  "ME",
  "ETE",
] as const;

export type Branch = (typeof BRANCHES)[number];

export const YEAR_VALUES = ["FIRST", "SECOND", "THIRD", "FOURTH"] as const;

export const YEARS = [
  { value: "FIRST", label: "1st year" },
  { value: "SECOND", label: "2nd year" },
  { value: "THIRD", label: "3rd year" },
  { value: "FOURTH", label: "4th year" },
] as const;

export type Year = (typeof YEAR_VALUES)[number];

export function yearLabel(year: Year | null | undefined): string {
  return YEARS.find((y) => y.value === year)?.label ?? "";
}

// USN: "1RV" or "1RZ" + 7 alphanumerics (e.g. 1RV22CS001). Tune here if the format
// needs to be stricter.
export const USN_REGEX = /^1R[VZ][0-9A-Z]{7}$/i;

export function normalizeUsn(usn: string): string {
  return usn.trim().toUpperCase();
}

// Resolves a leaderboard timeframe selection into a concrete [start, end]
// window. `start`/`end` are undefined when unbounded.
import { formatDate } from "@/lib/format";

export type RangeKey = "all" | "month" | "6mo" | "custom";

export const RANGE_PRESETS: { key: RangeKey; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "month", label: "This month" },
  { key: "6mo", label: "Last 6 months" },
  { key: "custom", label: "Custom" },
];

export type Window = {
  key: RangeKey;
  label: string;
  start?: Date;
  end?: Date;
};

function parseDay(value: string | undefined, endOfDay = false): Date | undefined {
  if (!value) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return undefined;
  const d = new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0,
  );
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function resolveWindow(
  range: string | undefined,
  from?: string,
  to?: string,
): Window {
  const now = new Date();
  switch (range) {
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { key: "month", label: "This month", start, end: now };
    }
    case "6mo": {
      const start = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      return { key: "6mo", label: "Last 6 months", start, end: now };
    }
    case "custom": {
      const start = parseDay(from);
      const end = parseDay(to, true);
      if (!start && !end) return { key: "all", label: "All time" };
      const fmt = (d?: Date) => (d ? formatDate(d) : "…");
      return {
        key: "custom",
        label: `${fmt(start)} → ${fmt(end)}`,
        start,
        end,
      };
    }
    default:
      return { key: "all", label: "All time" };
  }
}

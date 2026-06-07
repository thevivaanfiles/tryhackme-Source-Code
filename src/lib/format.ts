// Formats a Date into the value expected by <input type="datetime-local">
// (local time, "YYYY-MM-DDTHH:mm"). Server runs in the host's local timezone.
export function toLocalDatetimeInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

// India Standard Time is a fixed UTC+05:30 (no DST), so we can convert with a
// constant offset rather than relying on the server's timezone.
const IST_OFFSET_MIN = 5 * 60 + 30; // +05:30

// Formats a Date as an IST wall-clock value for <input type="datetime-local">.
export function toISTInput(date: Date): string {
  const ist = new Date(date.getTime() + IST_OFFSET_MIN * 60_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())}` +
    `T${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}`
  );
}

// Parses a "YYYY-MM-DDTHH:mm" value that the admin entered in IST into a real
// (UTC-based) Date. Returns null if the value is malformed.
export function fromISTInput(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const [, y, mo, d, h, min] = m.map(Number);
  const utcMs = Date.UTC(y, mo - 1, d, h, min) - IST_OFFSET_MIN * 60_000;
  const date = new Date(utcMs);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Date-only display, e.g. "23 Apr 2026" (in IST for consistency).
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Human-readable IST timestamp for display, e.g. "12 Jun 2026, 6:30 pm IST".
export function formatIST(date: Date): string {
  const s = date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${s} IST`;
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import DecryptedText from "@/components/DecryptedText";

type Result = {
  ok: boolean;
  message: string;
};

export function SubmitForm({
  challengeId,
  archived = false,
}: {
  challengeId: string;
  archived?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setResult(null);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, value }),
      });
      const data = await res.json();
      if (res.ok && data.correct) {
        new Audio('/sounds/notification.mp3').play().catch(() => {});
        setResult({
          ok: true,
          message: data.alreadySolved
            ? "You've already solved this challenge."
            : data.archived
              ? "Correct! Archived challenge — 0 points, but nice solve."
              : `Correct! +${data.awarded} points.`,
        });
        setValue("");
        router.refresh();
      } else if (res.ok) {
        setResult({ ok: false, message: "Incorrect flag. Try again." });
        new Audio('https://www.myinstants.com/media/sounds/fahhhhhhhhhhhhhh.mp3').play().catch(() => {});
      } else {
        setResult({ ok: false, message: data.error ?? "Something went wrong." });
      }
    } catch {
      setResult({ ok: false, message: "Network error. Try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {archived && (
        <p className="text-xs text-amber-300/90">
          Practice mode — this archived challenge no longer awards points.
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="flag{...}"
          required
          autoComplete="off"
          className="field flex-1 font-mono"
        />
        <button type="submit" disabled={pending} className="btn btn-primary">
          <DecryptedText text={pending ? "Checking…" : "Submit flag"} />
        </button>
      </div>
      {result && (
        <p
          className={`text-sm ${result.ok ? "text-emerald-300" : "text-red-400"}`}
        >
          {result.message}
        </p>
      )}
    </form>
  );
}

"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type FormState } from "@/lib/actions/password";
import DecryptedText from "@/components/DecryptedText";

export function ForgotForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    requestPasswordReset,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.info && (
        <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {state.info}
        </p>
      )}
      {state?.error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {state.error}
        </p>
      )}
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm text-slate-300">
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="email"
          className="field" />
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary btn-3d w-full">
        <DecryptedText text={pending ? "Sending…" : "Send reset link"} />
      </button>
      <p className="text-center text-sm text-slate-400">
        Remembered it?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

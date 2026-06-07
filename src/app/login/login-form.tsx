"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  loginAction,
  resendVerification,
  type FormState,
} from "@/lib/actions/auth";
import DecryptedText from "@/components/DecryptedText";

function ResendVerification({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    resendVerification,
    undefined,
  );
  return (
    <form action={formAction} className="mt-2">
      <input type="hidden" name="email" value={email} />
      {state?.info ? (
        <p className="text-xs text-emerald-300">{state.info}</p>
      ) : (
        <button
          type="submit"
          disabled={pending}
          className="text-xs text-accent underline hover:text-sky-300 disabled:opacity-60"
        >
          {pending ? "Sending…" : "Resend verification email"}
        </button>
      )}
    </form>
  );
}

export function LoginForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    loginAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {state.error}
          {state.needsVerify && state.email && (
            <ResendVerification email={state.email} />
          )}
        </div>
      )}
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm text-slate-300">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="field"
        />
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm text-slate-300">
            Password
          </label>
          <Link href="/forgot" className="text-xs text-accent hover:underline">
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="field"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary btn-3d w-full"
      >
        <DecryptedText text={pending ? "Signing in…" : "Sign in"} />
      </button>
      <p className="text-center text-sm text-slate-400">
        No account?{" "}
        <Link href="/register" className="text-accent hover:underline">
          Register
        </Link>
      </p>
    </form>
  );
}

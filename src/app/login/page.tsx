import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; reset?: string; verifyError?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/challenges");

  const sp = await searchParams;
  const notice = sp.verified
    ? { ok: true, text: "Email verified — you can sign in now." }
    : sp.reset
      ? { ok: true, text: "Password updated. Sign in with your new password." }
      : sp.verifyError
        ? { ok: false, text: "That verification link is invalid or expired. Sign in to resend." }
        : null;

  return (
    <div className="mx-auto max-w-sm py-6">
      <div className="glass rounded-2xl p-7">
        <h1 className="mb-1 text-2xl font-bold text-white">Welcome back</h1>
        <p className="mb-6 text-sm text-slate-400">
          Sign in to tackle this week&apos;s challenge.
        </p>
        {notice && (
          <p
            className={`mb-4 rounded-md px-3 py-2 text-sm ${
              notice.ok
                ? "bg-emerald-500/10 text-emerald-300"
                : "bg-amber-500/10 text-amber-300"
            }`}
          >
            {notice.text}
          </p>
        )}
        <LoginForm />
      </div>
    </div>
  );
}

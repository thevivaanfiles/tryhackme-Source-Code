import { ForgotForm } from "./forgot-form";

export const metadata = { title: "Forgot password" };

export default function ForgotPage() {
  return (
    <div className="mx-auto max-w-sm py-6">
      <div className="glass rounded-2xl p-7">
        <h1 className="mb-1 text-2xl font-bold text-white">Forgot password</h1>
        <p className="mb-6 text-sm text-slate-400">
          Enter your email and we&apos;ll send you a link to reset it.
        </p>
        <ForgotForm />
      </div>
    </div>
  );
}

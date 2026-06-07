import Link from "next/link";
import { ChallengeForm } from "@/components/challenge-form";
import { toISTInput } from "@/lib/format";

export default function NewChallengePage() {
  return (
    <div className="space-y-4">
      <Link
        href="/admin/challenges"
        className="text-sm text-slate-400 hover:text-white"
      >
        ← Challenges
      </Link>
      <h1 className="text-xl font-bold text-white">New challenge</h1>
      <ChallengeForm defaults={{ releaseAtLocal: toISTInput(new Date()) }} />
    </div>
  );
}

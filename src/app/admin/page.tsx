import Link from "next/link";
import { db } from "@/lib/db";
import DecryptedText from "@/components/DecryptedText";

export default async function AdminDashboard() {
  const [users, challenges, published, solves] = await Promise.all([
    db.user.count(),
    db.challenge.count(),
    db.challenge.count({ where: { published: true } }),
    db.solve.count(),
  ]);

  const stats = [
    { label: "Users", value: users },
    { label: "Challenges", value: challenges },
    { label: "Published", value: published },
    { label: "Total solves", value: solves },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="glass glass-hover rounded-2xl p-5">
            <p className="text-3xl font-bold text-sky-300">{s.value}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/challenges/new" className="btn btn-primary">
          <DecryptedText text="+ New challenge" />
        </Link>
        <Link href="/admin/challenges" className="btn btn-ghost">
          <DecryptedText text="Manage challenges" />
        </Link>
      </div>
    </div>
  );
}

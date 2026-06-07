import Link from "next/link";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Admin" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div className="glass flex items-center gap-4 rounded-xl px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-widest text-amber-300">
          <Link href="/admin"> Admin </Link>
        </span>
        <nav className="flex gap-1 text-sm">
          <Link
            href="/admin/challenges"
            className="rounded-lg px-3 py-1.5 text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            Challenges
          </Link>
          <Link
            href="/admin/users"
            className="rounded-lg px-3 py-1.5 text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            Users
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}

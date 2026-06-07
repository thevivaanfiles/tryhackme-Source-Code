import Link from "next/link";
import { db } from "@/lib/db";
import { yearLabel } from "@/lib/profile";
import { Avatar } from "@/components/avatar";

export const metadata = { title: "Players" };

export default async function UsersPage() {
  const users = await db.user.findMany({
    where: { hidden: false },
    orderBy: [{ name: "asc" }, { username: "asc" }],
    select: {
      id: true,
      username: true,
      name: true,
      branch: true,
      year: true,
      avatarPath: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Players</h1>
        <p className="mt-1 text-sm text-slate-400">
          {users.length} {users.length === 1 ? "member" : "members"} of the club.
          Click anyone to view their profile.
        </p>
      </div>

      {users.length === 0 ? (
        <p className="glass rounded-2xl p-8 text-slate-400">No players yet.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => (
            <li key={u.id}>
              <Link
                href={`/u/${u.username}`}
                className="glass glass-hover flex items-center gap-3 rounded-2xl p-4"
              >
                <Avatar
                  userId={u.id}
                  name={u.name ?? u.username}
                  avatar={u.avatarPath}
                  size={44}
                />
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">
                    {u.name ?? u.username}
                  </p>
                  <p className="truncate text-xs text-slate-400">@{u.username}</p>
                  {(u.branch || u.year) && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {u.branch && <span className="chip">{u.branch}</span>}
                      {u.year && <span className="chip">{yearLabel(u.year)}</span>}
                    </div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

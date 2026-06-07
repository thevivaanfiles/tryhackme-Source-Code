import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import {
  setUserRole,
  setUserDisabled,
  setUserHidden,
  setUserVerified,
  deleteUser,
} from "@/lib/actions/admin";

const actionBtn =
  "rounded-lg border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition";

export default async function AdminUsersPage() {
  const me = await requireAdmin();
  const users = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { solves: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-white">Users</h1>
      <div className="glass overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[920px] text-sm">
          <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-5 py-3 font-medium">Username</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Verified</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 text-right font-medium">Solves</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === me.id;
              return (
                <tr
                  key={u.id}
                  className={`border-t border-white/5 transition hover:bg-white/[0.03] ${
                    u.disabled || u.hidden ? "opacity-50" : ""
                  }`}
                >
                  <td className="px-5 py-3 font-medium text-white">
                    <Link
                      href={`/u/${u.username}`}
                      className="transition hover:text-accent"
                    >
                      {u.username}
                    </Link>
                    {isSelf && (
                      <span className="ml-2 text-xs text-accent">(you)</span>
                    )}
                    {u.hidden && (
                      <span className="ml-2 align-middle text-xs text-fuchsia-300">
                        👻 hidden
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-400">{u.email}</td>
                  <td className="px-5 py-3">
                    {u.emailVerified ? (
                      <span className="chip border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                        ✓ Verified
                      </span>
                    ) : (
                      <span className="chip border-amber-400/30 bg-amber-400/10 text-amber-300">
                        Unverified
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        u.role === "ADMIN"
                          ? "chip border-amber-400/30 bg-amber-400/10 text-amber-300"
                          : "chip"
                      }
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-slate-300">
                    {u._count.solves}
                  </td>
                  <td className="px-5 py-3">
                    {isSelf ? (
                      <span className="block text-right text-xs text-slate-600">
                        —
                      </span>
                    ) : (
                      <div className="flex flex-nowrap items-center justify-end gap-1.5">
                        <form action={setUserVerified}>
                          <input type="hidden" name="userId" value={u.id} />
                          <input
                            type="hidden"
                            name="verified"
                            value={u.emailVerified ? "false" : "true"}
                          />
                          <button
                            type="submit"
                            className={`${actionBtn} border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20`}
                          >
                            {u.emailVerified ? "Unverify" : "Verify"}
                          </button>
                        </form>
                        <form action={setUserRole}>
                          <input type="hidden" name="userId" value={u.id} />
                          <input
                            type="hidden"
                            name="role"
                            value={u.role === "ADMIN" ? "USER" : "ADMIN"}
                          />
                          <button
                            type="submit"
                            className={`${actionBtn} border-white/12 bg-white/5 text-slate-300 hover:bg-white/10`}
                          >
                            {u.role === "ADMIN" ? "Demote" : "Make admin"}
                          </button>
                        </form>
                        <form action={setUserDisabled}>
                          <input type="hidden" name="userId" value={u.id} />
                          <input
                            type="hidden"
                            name="disabled"
                            value={u.disabled ? "false" : "true"}
                          />
                          <button
                            type="submit"
                            className={`${actionBtn} border-white/12 bg-white/5 text-slate-300 hover:bg-white/10`}
                          >
                            {u.disabled ? "Enable" : "Disable"}
                          </button>
                        </form>
                        <form action={setUserHidden}>
                          <input type="hidden" name="userId" value={u.id} />
                          <input
                            type="hidden"
                            name="hidden"
                            value={u.hidden ? "false" : "true"}
                          />
                          <button
                            type="submit"
                            className={`${actionBtn} border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200 hover:bg-fuchsia-400/20`}
                          >
                            {u.hidden ? "Unhide" : "Hide"}
                          </button>
                        </form>
                        <form action={deleteUser}>
                          <input type="hidden" name="userId" value={u.id} />
                          <button
                            type="submit"
                            className={`${actionBtn} border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20`}
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

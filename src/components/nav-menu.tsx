"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DecryptedText from "@/components/DecryptedText";

type NavUser = { username: string; role: string } | null;

export function NavMenu({
  user,
  logoutAction,
}: {
  user: NavUser;
  logoutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);

  const links = (
    <>
      <NavLink href="/challenges" pathname={pathname} onClick={close}>
        Challenges
      </NavLink>
      <NavLink href="/leaderboard" pathname={pathname} onClick={close}>
        Leaderboard
      </NavLink>
      <NavLink href="/users" pathname={pathname} onClick={close}>
        Players
      </NavLink>

      {user ? (
        <>
          {user.role === "ADMIN" && (
            <NavLink
              href="/admin"
              pathname={pathname}
              onClick={close}
              className="text-amber-300 hover:text-amber-200"
            >
              Admin
            </NavLink>
          )}
          <NavLink href="/profile" pathname={pathname} onClick={close}>
            {user.username}
          </NavLink>
          <form action={logoutAction} className="max-sm:w-full">
            <button
              type="submit"
              onClick={close}
              className="btn btn-ghost w-full px-3 py-1.5 sm:w-auto"
            >
              <DecryptedText text="Sign out" />
            </button>
          </form>
        </>
      ) : (
        <>
          <NavLink href="/login" pathname={pathname} onClick={close}>
            Sign in
          </NavLink>
          <Link
            href="/register"
            onClick={close}
            className="btn btn-primary btn-3d w-full px-3.5 py-1.5 sm:w-auto"
          >
            <DecryptedText text="Register" />
          </Link>
        </>
      )}
    </>
  );

  return (
    <>
      {/* Desktop links */}
      <div className="hidden items-center gap-1 text-sm sm:flex sm:gap-2">
        {links}
      </div>

      {/* Mobile toggle */}
      <button
        type="button"
        aria-label="Toggle navigation menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-200 transition hover:bg-white/5 sm:hidden"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {open ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {/* Mobile dropdown panel */}
      {open && (
        <div className="absolute inset-x-0 top-full sm:hidden">
          <div className="glass-strong mx-3 mt-2 flex flex-col gap-1 rounded-2xl p-3 text-sm shadow-xl" style={{ backgroundColor: "rgba(13, 18, 32, 0.99)" }}>
            {links}
          </div>
        </div>
      )}
    </>
  );
}

function NavLink({
  href,
  pathname,
  onClick,
  className = "",
  children,
}: {
  href: string;
  pathname: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white sm:py-1.5 ${active ? "bg-white/5 text-white" : ""
        } ${className}`}
    >
      {children}
    </Link>
  );
}

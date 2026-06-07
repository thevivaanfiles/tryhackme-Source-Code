import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/lib/actions/auth";
import { NavMenu } from "@/components/nav-menu";
import cclogo from "../../public/cclogo.png";

export async function NavBar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-white/5">
      <div className="glass-strong relative">
        <nav className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3">
          <Link href="/" className="group flex min-w-0 items-center gap-2.5">
            <Image
              src={cclogo}
              alt="Coding Club"
              priority
              className="h-9 w-auto drop-shadow-[0_0_12px_rgba(56,189,248,0.25)]"
              style={{ height: "2.25rem", width: "auto" }}
            />
            <span className="truncate font-mono text-sm font-semibold tracking-tight text-slate-200">
              tryhackme<span className="gradient-text">.codingclub</span>
            </span>
          </Link>

          <NavMenu
            user={user ? { username: user.username, role: user.role } : null}
            logoutAction={logoutAction}
          />
        </nav>
      </div>
    </header>
  );
}

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Returns the logged-in user session or null. Use in server components/routes.
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

// Redirects to login if not authenticated; otherwise returns the user.
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// Redirects non-admins; returns the user when they are an admin.
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

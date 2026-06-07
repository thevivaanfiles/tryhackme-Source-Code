import { headers } from "next/headers";

// Builds the app's origin from the incoming request, so email links point at
// whatever domain the app is actually served on (localhost, a VPS, etc.).
export async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto =
      h.get("x-forwarded-proto") ??
      (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return process.env.AUTH_URL ?? "http://localhost:3000";
}

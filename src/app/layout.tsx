import type { Metadata } from "next";
import { Geist, Geist_Mono, Ubuntu } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/nav-bar";
import { AuroraBackground } from "@/components/aurora-background";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Ubuntu — used for button labels.
const ubuntu = Ubuntu({
  variable: "--font-ubuntu",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "tryhackme.codingclub",
    template: "%s · tryhackme.codingclub",
  },
  description: "Weekly tryhackme challenges for the coding club.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${ubuntu.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <AuroraBackground />
        <NavBar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-10">
          {children}
        </main>
        <footer className="border-t border-white/5 px-4 py-6 text-center text-xs text-slate-500">
          <span className="font-mono">tryhackme.codingclub</span> | a new challenge every week.
        </footer>
      </body>
    </html>
  );
}

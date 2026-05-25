import type { Metadata } from "next";
import Link from "next/link";
import { Command } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "AstraOS",
  description: "AstraOS for Wati."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="sticky top-0 z-30 border-b border-border bg-white/88 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
              <Link href="/admin" className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-700 text-white">
                  <Command className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold leading-none">AstraOS</p>
                  <p className="mt-1 text-xs text-muted-foreground">Wati</p>
                </div>
              </Link>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}

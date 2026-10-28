import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DISCLAIMER } from "@/lib/disclaimer";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description:
    "Model-by-model guides to what is safe to disable on an Android TV or Google TV, with restore commands for every change.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-white text-neutral-900 antialiased">
        <div className="flex-1">{children}</div>
        <footer className="border-t border-neutral-200 px-4 py-6 text-xs leading-relaxed text-neutral-600">
          <p className="mx-auto max-w-3xl">{DISCLAIMER}</p>
        </footer>
      </body>
    </html>
  );
}

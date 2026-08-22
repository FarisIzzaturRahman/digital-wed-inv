import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Platform Undangan Digital",
  description: "Multi-tenant Premium Digital Wedding Invitation SaaS Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased bg-zinc-50 text-zinc-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}

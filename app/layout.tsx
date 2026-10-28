import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import Link from "next/link";
import { ConnectNoir } from "@/components/ConnectNoir";
import { Mark } from "@/components/Mark";
import "./globals.css";

const sans = Figtree({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Brass",
  description: "Hosted Zcash invoices. A bill for one payment, or a pay link that opens a new payment for each person.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={sans.variable}>
        <header className="nav">
          <Link className="brand" href="/">
            <Mark />
            <span>Brass</span>
          </Link>
          <div className="nav-actions">
            <Link href="/settings">Settings</Link>
            <ConnectNoir />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}

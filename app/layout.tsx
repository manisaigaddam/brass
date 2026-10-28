import type { Metadata } from "next";
import { Source_Sans_3, Syne } from "next/font/google";
import Link from "next/link";
import { ProfileLink } from "@/components/ProfileLink";
import { ConnectNoir } from "@/components/ConnectNoir";
import { Mark } from "@/components/Mark";
import "./globals.css";

const sans = Source_Sans_3({ subsets: ["latin"], variable: "--font-sans" });
const display = Syne({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Brass",
  description: "Hosted invoices for shielded Zcash. A bill for one payment, or a pay link for many.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable}`}>
        <header className="nav">
          <Link className="brand" href="/">
            <Mark size={22} />
            <span>Brass</span>
          </Link>
          <nav className="nav-actions" aria-label="Site">
            <ProfileLink look="text" />
            <Link href="/settings">Settings</Link>
            <ConnectNoir />
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}

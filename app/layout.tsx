import type { Metadata } from "next";
import { Figtree, Fraunces } from "next/font/google";
import { ConnectNoir } from "@/components/ConnectNoir";
import "./globals.css";

const sans = Figtree({ subsets: ["latin"], variable: "--font-sans" });
const display = Fraunces({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Brass — A fresh shielded address for every payment",
  description:
    "Save a viewing key once. Then send a Zcash bill, or share a pay link that starts a separate payment for each person.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable}`}>
        <div className="wallet-bar">
          <ConnectNoir />
        </div>
        {children}
      </body>
    </html>
  );
}

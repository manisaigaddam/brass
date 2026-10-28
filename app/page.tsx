import Link from "next/link";
import { Mark } from "@/components/Mark";
import { listDesk } from "@/lib/checkout";
import { zatoshiToZec } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const watcher = Boolean(process.env.WALLETD_URL?.trim());
  const ready = watcher || Boolean(process.env.MERCHANT_UA?.trim());
  const { bills, links } = ready ? await listDesk() : { bills: [], links: [] };

  return (
    <main className="desk">
      <header className="top">
        <Link className="brand" href="/">
          <Mark />
          <strong>Brass</strong>
        </Link>
        <p className="tag">A fresh shielded address for every payment.</p>
      </header>
      <h1>Send a bill, or leave the link open.</h1>
      <p className="lede">
        Both end as the same thing: one payer, one address, one receipt. A bill is that payment, created now. A pay
        link waits, and opens a new bill each time someone pays.
      </p>
      {watcher ? null : (
        <p className="banner">
          Start the watcher and set WALLETD_URL. That process holds your viewing key, makes a new address for each
          payment, and marks the bill paid when the ZEC arrives. MERCHANT_UA is only a stand-in and cannot settle a
          shielded payment.
        </p>
      )}
      <section className="choices">
        <article className="choice">
          <h2>Bill</h2>
          <p>One order. One payer. It closes when that payment arrives.</p>
          <p className="eg">A cart total. This buyer’s NFT. A quote you already priced.</p>
          <Link className="button" href="/bills/new">
            Create a bill
          </Link>
        </article>
        <article className="choice">
          <h2>Pay link</h2>
          <p>One offer. Each person who pays gets their own bill, address, and receipt.</p>
          <p className="eg">A menu item anyone can buy. A donation. A ticket.</p>
          <Link className="button" href="/links/new">
            Create a pay link
          </Link>
        </article>
      </section>
      <section className="lists">
        <div className="panel">
          <h2>Bills</h2>
          <div className="list">
            {bills.length === 0 ? <p>No bills yet.</p> : null}
            {bills.map((bill) => (
              <Link key={bill.id} href={`/bills/${bill.id}`}>
                <span>{bill.title}</span>
                <span>
                  {bill.amountZatoshi ? `${zatoshiToZec(bill.amountZatoshi)} ZEC` : ""} · {bill.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
        <div className="panel">
          <h2>Pay links</h2>
          <div className="list">
            {links.length === 0 ? <p>No pay links yet.</p> : null}
            {links.map((link) => (
              <Link key={link.id} href={`/links/${link.id}`}>
                <span>{link.title}</span>
                <span>{link.amountZatoshi ? `${zatoshiToZec(link.amountZatoshi)} ZEC` : "Payer chooses"}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

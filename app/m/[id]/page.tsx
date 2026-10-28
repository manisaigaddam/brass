import Link from "next/link";
import { notFound } from "next/navigation";
import { Mark } from "@/components/Mark";
import { profileDesk } from "@/lib/checkout";
import { zatoshiToZec } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function MerchantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const desk = await profileDesk(id);
  if (!desk) notFound();
  const { profile: merchant, bills, links } = desk;
  return (
    <main className="desk">
      <Link className="brand" href="/">
        <Mark />
        <strong>Brass</strong>
      </Link>
      <h1>Payments</h1>
      <p className="lede">
        Bookmark this page. New bills and pay links use the viewing key already saved in Settings. Each payer gets a
        new address. The ZEC goes to your wallet.
      </p>
      <div className="row">
        <Link className="button" href={`/m/${merchant.id}/bills/new`}>
          Create a bill
        </Link>
        <Link className="button" href={`/m/${merchant.id}/links/new`}>
          Create a pay link
        </Link>
        <Link className="button" href="/settings">
          Settings
        </Link>
      </div>
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

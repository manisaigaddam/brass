import Link from "next/link";
import { Mark } from "@/components/Mark";
import { ProfileLink } from "@/components/ProfileLink";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="desk">
      <header className="top">
        <Link className="brand" href="/">
          <Mark />
          <strong>Brass</strong>
        </Link>
        <Link href="/settings">Settings</Link>
      </header>
      <h1>Bills and pay links.</h1>
      <p className="lede">
        Save the viewing key once in Settings. After that, create a bill for one order, or a pay link that starts a
        separate payment for each person. The key is not asked again.
      </p>
      <section className="choices">
        <article className="choice">
          <h2>Bill</h2>
          <p>One order. One payer. It closes when that payment arrives.</p>
          <p className="eg">A cart total. This buyer’s NFT. A price you already agreed.</p>
        </article>
        <article className="choice">
          <h2>Pay link</h2>
          <p>One offer. Each person who pays gets their own bill, address, and receipt.</p>
          <p className="eg">A menu item. A donation. A ticket anyone can buy.</p>
        </article>
      </section>
      <div className="row">
        <ProfileLink />
        <Link className="button" href="/settings">
          Settings
        </Link>
      </div>
    </main>
  );
}

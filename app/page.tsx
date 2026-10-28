import { ProfileLink } from "@/components/ProfileLink";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="brand-word">Brass</p>
          <h1>Shielded invoices that settle to your wallet.</h1>
          <p className="lede">
            Your customer sees the amount and pays. You see that this invoice was paid. The public chain does not.
          </p>
          <div className="hero-cta">
            <ProfileLink look="gold" />
            <a className="button quiet" href="#how">
              How it works
            </a>
          </div>
        </div>
        <aside className="hero-product" aria-label="Sample customer invoice">
          <div className="hero-invoice">
            <div className="hero-invoice-top">
              <span>Invoice</span>
              <span className="pulse">Open</span>
            </div>
            <p className="hero-amount">0.015 ZEC</p>
            <p className="hero-for">Workshop · Saturday</p>
            <div className="hero-qr" aria-hidden="true">
              <svg viewBox="0 0 120 120" width="140" height="140">
                <rect width="120" height="120" fill="#F7F4EE" />
                <g fill="#1A1917">
                  <rect x="10" y="10" width="28" height="28" />
                  <rect x="16" y="16" width="16" height="16" fill="#F7F4EE" />
                  <rect x="20" y="20" width="8" height="8" />
                  <rect x="82" y="10" width="28" height="28" />
                  <rect x="88" y="16" width="16" height="16" fill="#F7F4EE" />
                  <rect x="92" y="20" width="8" height="8" />
                  <rect x="10" y="82" width="28" height="28" />
                  <rect x="16" y="88" width="16" height="16" fill="#F7F4EE" />
                  <rect x="20" y="92" width="8" height="8" />
                  <rect x="48" y="14" width="8" height="8" />
                  <rect x="60" y="14" width="8" height="8" />
                  <rect x="48" y="28" width="8" height="8" />
                  <rect x="52" y="48" width="16" height="16" />
                  <rect x="72" y="52" width="8" height="8" />
                  <rect x="48" y="72" width="8" height="8" />
                  <rect x="64" y="72" width="8" height="8" />
                  <rect x="80" y="72" width="8" height="8" />
                  <rect x="80" y="88" width="8" height="8" />
                  <rect x="96" y="80" width="8" height="8" />
                  <rect x="96" y="96" width="8" height="8" />
                </g>
              </svg>
            </div>
            <p className="hero-hint">Scan, or connect Noir and pay here</p>
            <div className="hero-pay">Pay 0.015 ZEC</div>
          </div>
        </aside>
      </section>

      <section className="band" id="how">
        <h2>Two ways to ask for money</h2>
        <div className="band-grid">
          <div>
            <p className="band-label">Bill</p>
            <p>One order. One customer. The invoice closes when they pay.</p>
          </div>
          <div>
            <p className="band-label">Pay link</p>
            <p>One price you leave open. Each buyer gets a new invoice and a new shielded address.</p>
          </div>
        </div>
      </section>

      <section className="band band-last">
        <h2>Where the money goes</h2>
        <p className="band-copy">
          Brass never holds a spending key. A viewing key on a separate watcher sees the note. The ZEC arrives in the
          wallet you already use.
        </p>
      </section>
    </main>
  );
}

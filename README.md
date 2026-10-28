# Brass

A fresh shielded address for every payment.

Brass is a Zcash till. You send one bill, or you share a pay link that starts a separate payment for each person. Noir pays in the page. Zodl, Zashi, YWallet, and Zingo pay the same ZIP-321 QR. The ZEC goes to your wallet.

## Bill and pay link

A **bill** is one order. One payer. It closes when that payment arrives. Use it for a cart total, one buyer of an NFT, or a quote you already priced.

A **pay link** is one offer you can share. Each person who presses Pay gets their own bill, their own address, and their own receipt. You see the list. They see only theirs. Use it for a menu item, a donation, or a ticket.

The object that gets paid is always a bill. A pay link is the door that creates the next one. You cannot replace bills with only a shared link when the amount belongs to one cart, or when a second person must not be able to pay the same NFT.

## Run it

```bash
cd brass
npm install
copy .env.example .env.local
copy watcher\config.example.json watcher\config.json
```

Put your Unified Full Viewing Key in `watcher/config.json` under `vk`. That file is gitignored. Do not commit it, and do not paste it into chat. Set `birth_height` to a recent mainnet height from your wallet, a little before you start testing.

```bash
docker compose up -d
npm run dev
```

`.env.local` should contain `WALLETD_URL=http://127.0.0.1:18082`. Open http://localhost:3000. Create a bill for a tiny amount. Pay it from Noir, or scan the QR with Zodl. Leave the pay page open. It asks the watcher every few seconds and turns to paid when the note is visible. There is no mark-paid button.

`MERCHANT_UA` is not required for this. It is a single shared address for when the watcher is off. Shielded payments to that address stay invisible to the website, so a bill cannot settle itself that way.

The watcher is [zcash-walletd](https://github.com/hhanh00/zcash-walletd). It holds the viewing key, asks Stardust (`https://us.zec.stardust.rest:443`) for compact blocks, and derives a new `u1` per payment. It cannot spend. Your Zodl, Noir, YWallet, or Zingo wallet still holds the spending key. Export the viewing key from YWallet or Zingo. Do not export the seed into this config.

## API

Desk calls need the `brass_desk` cookie, or `Authorization: Bearer $MERCHANT_SECRET`, once `MERCHANT_SECRET` is set. Leave it empty on localhost.

```http
POST /api/bills
{ "title": "Table 4", "amountZec": "0.001", "note": "Dinner", "expiresInHours": 24 }

POST /api/links
{ "title": "Coffee", "amountZec": "0.002", "note": "Espresso", "maxPayments": null }

POST /api/links/link_…/payments
{ "amountZec": null }

GET /api/payments/pay_…
POST /api/payments/pay_…   { "action": "broadcast", "txid": "…" }
```

The payer URL is `/pay/<id>`. The shared offer is `/l/<id>`.

## What is not durable on Vercel yet

Bills are stored in `data/store.json` on the machine running Next. That is correct for this computer. A Vercel serverless deploy does not keep that file. Deploy the desk after the store moves to a hosted database. The payer page, the QR, and the API shape are already the Vercel app.

## Logo

The mark is `app/icon.svg` and the receipt glyph in `components/Mark.tsx`. Paper `#F7F1E6`, ink `#231F20`, gold `#F4B728`.

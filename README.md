# Brass

A fresh shielded address for every payment.

Brass is a Zcash checkout. The website runs on Vercel. The watcher runs on AWS. A merchant saves a viewing key once in Settings, then creates bills and pay links. Noir pays in the page. Zodl, Zashi, YWallet, and Zingo pay the same ZIP-321 QR. The ZEC goes to that merchant’s wallet.

## Bill and pay link

A **bill** is one order. One payer. It closes when that payment arrives. Use it for a cart total, one buyer of an NFT, or a quote you already priced.

A **pay link** is one offer you can share. Each person who presses Pay gets their own bill, their own address, and their own receipt. You see the list. They see only theirs. Use it for a menu item, a donation, or a ticket.

The object that gets paid is always a bill. A pay link is the door that creates the next one. You cannot replace bills with only a shared link when the amount belongs to one cart, or when a second person must not be able to pay the same NFT.

## Two machines

The website and the watcher do not run on the same box.

| | Where | What it holds |
|---|---|---|
| Website | Vercel | Settings, bills, pay links, receipts |
| Watcher | AWS | Viewing keys, one scan process per merchant |
| Chain data | Public lightwalletd `https://us.zec.stardust.rest:443` | Compact blocks. It cannot read shielded notes |

The watcher asks that public server for blocks, then uses the viewing key to see notes that belong to the merchant. The website never talks to the chain. It asks the watcher for a new address, and later asks whether that address was paid.

The latest block height is read by the watcher when a viewing key is saved. The merchant does not type a block number.

## AWS, watcher only

Use Ubuntu 24.04 on a `t3.small` in `ap-south-1` (Mumbai), with 20 GB of disk. A micro instance is too small once Docker is scanning a wallet.

Security group:

| Port | Who |
|---|---|
| 22 | Your IP only |
| 8090 | The internet, because Vercel calls it. The secret is required. |

Do not open 3000, 8000, or 18100. The website does not run here. Wallet ports stay on localhost.

Copy one file. Do not copy the Next app, `node_modules`, or Supabase keys.

```bash
sudo apt update
sudo apt install -y docker.io
sudo usermod -aG docker ubuntu
```

Log out and back in. From your computer:

```bash
scp services/manager/server.mjs ubuntu@YOUR_AWS_IP:/home/ubuntu/server.mjs
```

On the VPS, in `/home/ubuntu/.env` next to `server.mjs`:

```bash
MANAGER_SECRET=the-string-from-the-setup-notes
LWD_URL=https://us.zec.stardust.rest:443
WEBSITE_URL=https://YOUR_APP.vercel.app
MANAGER_PORT=8090
```

Install Node 20, `cd /home/ubuntu`, then `node server.mjs`. Set `WEBSITE_URL` after the Vercel deploy and restart. Viewing keys stay in `/home/ubuntu/data/aws-watcher/`.

## Vercel, website only

Run `supabase/schema.sql` in the Supabase SQL editor. In the Vercel project, set:

```bash
MANAGER_URL=http://YOUR_AWS_IP:8090
MANAGER_SECRET=the-string-from-the-setup-notes
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=the-service-role-secret
```

Use the service role key. Do not use the anon key, and do not prefix it with `NEXT_PUBLIC_`.

Deploy `brass`. Open Settings and paste only the viewing key. Then create a bill or a pay link. The title on that form is the name of the charge.

## API

```http
POST /api/bills
{ "merchantId": "mer_…", "title": "Table 4", "amountZec": "0.001", "note": "Dinner", "expiresInHours": 24 }

POST /api/links
{ "merchantId": "mer_…", "title": "Coffee", "amountZec": "0.002", "note": "Espresso", "maxPayments": null }

POST /api/links/link_…/payments
{ "amountZec": null }

GET /api/payments/pay_…
```

The payer URL is `/pay/<id>`. The shared offer is `/l/<id>`.

## Logo

The mark is `app/icon.svg` and the receipt glyph in `components/Mark.tsx`. Paper `#F7F1E6`, ink `#231F20`, gold `#F4B728`.

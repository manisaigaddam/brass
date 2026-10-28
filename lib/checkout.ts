import { dbGet, dbInsert, dbUpdate } from "./db";
import { nid } from "./ids";
import { manager } from "./manager";
import { memoFor, zatoshiToZec, zecToZatoshi } from "./money";
import type { PayLink, Payment, PaymentStatus } from "./types";

type Transfer = { address: string; amount: number; note: string; txid: string };

type Profile = { id: string; watcherId: string; createdAt: string };

type ProfileRow = { id: string; watcher_id: string; created_at: string };
type LinkRow = {
  id: string;
  profile_id: string;
  title: string;
  note: string;
  amount_zatoshi: string | null;
  active: boolean;
  max_payments: number | null;
  created_at: string;
};
type PaymentRow = {
  id: string;
  profile_id: string;
  link_id: string | null;
  kind: "bill" | "link";
  title: string;
  note: string;
  amount_zatoshi: string | null;
  address: string;
  address_index: number | null;
  memo: string;
  status: PaymentStatus;
  received_zatoshi: string;
  txid: string | null;
  created_at: string;
  expires_at: string | null;
  paid_at: string | null;
};

function profileFrom(row: ProfileRow): Profile {
  return { id: row.id, watcherId: row.watcher_id, createdAt: row.created_at };
}

function linkFrom(row: LinkRow): PayLink {
  return {
    id: row.id,
    merchantId: row.profile_id,
    merchantName: "Brass",
    title: row.title,
    note: row.note,
    amountZatoshi: row.amount_zatoshi,
    active: row.active,
    maxPayments: row.max_payments,
    createdAt: row.created_at,
  };
}

function paymentFrom(row: PaymentRow): Payment {
  return {
    id: row.id,
    merchantId: row.profile_id,
    merchantName: "Brass",
    kind: row.kind,
    linkId: row.link_id,
    title: row.title,
    note: row.note,
    amountZatoshi: row.amount_zatoshi,
    address: row.address,
    addressIndex: row.address_index,
    sharedAddress: false,
    memo: row.memo,
    status: row.status,
    receivedZatoshi: row.received_zatoshi,
    txid: row.txid,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    paidAt: row.paid_at,
  };
}

function paymentPatch(payment: Payment) {
  return {
    status: payment.status,
    received_zatoshi: payment.receivedZatoshi,
    txid: payment.txid,
    paid_at: payment.paidAt,
    address: payment.address,
    address_index: payment.addressIndex,
  };
}

function expire(payment: Payment, now: number) {
  if (payment.status === "paid" || payment.status === "expired") return payment;
  if (payment.expiresAt && Date.parse(payment.expiresAt) <= now) payment.status = "expired";
  return payment;
}

function apply(payment: Payment, received: bigint, txid: string | null) {
  if (received < 0n) return;
  const previous = BigInt(payment.receivedZatoshi || "0");
  if (received < previous && payment.status === "paid") return;
  payment.receivedZatoshi = received.toString();
  if (txid) payment.txid = txid;
  const expected = payment.amountZatoshi ? BigInt(payment.amountZatoshi) : 0n;
  if (received <= 0n) return;
  if (expected > 0n && received < expected) {
    payment.status = "partial";
    return;
  }
  payment.status = "paid";
  payment.paidAt = payment.paidAt ?? new Date().toISOString();
}

async function freshAddress(profile: Profile, label: string) {
  return manager<{ address: string; addressIndex: number }>(`/v1/accounts/${profile.watcherId}/addresses`, {
    method: "POST",
    body: { label },
  });
}

export async function saveProfile(input: { ufvk: string }) {
  const id = nid("mer");
  const remote = await manager<{ account: { id: string; birthHeight: number } }>("/v1/accounts", {
    method: "POST",
    body: { ufvk: input.ufvk },
  });
  await dbInsert("profiles", { id, watcher_id: remote.account.id });
  return { id, birthHeight: remote.account.birthHeight };
}

export async function getProfile(id: string) {
  const rows = await dbGet<ProfileRow[]>(`profiles?id=eq.${encodeURIComponent(id)}&select=id,watcher_id,created_at`);
  return rows[0] ? profileFrom(rows[0]) : null;
}

export async function profileDesk(id: string) {
  const profile = await getProfile(id);
  if (!profile) return null;
  const [billRows, linkRows] = await Promise.all([
    dbGet<PaymentRow[]>(
      `payments?profile_id=eq.${encodeURIComponent(id)}&kind=eq.bill&select=*&order=created_at.desc`,
    ),
    dbGet<LinkRow[]>(`pay_links?profile_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.desc`),
  ]);
  const now = Date.now();
  return {
    profile: { id: profile.id },
    bills: billRows.map(paymentFrom).map((item) => expire(item, now)),
    links: linkRows.map(linkFrom),
  };
}

export async function createBill(input: {
  merchantId: string;
  title: string;
  note: string;
  amountZec: string;
  expiresInHours: number;
}) {
  const amount = zecToZatoshi(input.amountZec);
  if (amount <= 0n) throw new Error("Amount must be greater than zero.");
  const title = input.title.trim();
  if (!title) throw new Error("A bill needs a title.");
  const profile = await getProfile(input.merchantId);
  if (!profile) throw new Error("Save a viewing key in Settings first.");
  const hours = Number.isFinite(input.expiresInHours) ? input.expiresInHours : 24;
  const now = new Date();
  const payment: Payment = {
    id: nid("bill"),
    merchantId: profile.id,
    merchantName: "Brass",
    kind: "bill",
    linkId: null,
    title,
    note: input.note.trim(),
    amountZatoshi: amount.toString(),
    address: "",
    addressIndex: null,
    sharedAddress: false,
    memo: "",
    status: "open",
    receivedZatoshi: "0",
    txid: null,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + Math.max(1, hours) * 60 * 60 * 1000).toISOString(),
    paidAt: null,
  };
  payment.memo = memoFor(payment.id);
  const created = await freshAddress(profile, payment.id);
  payment.address = created.address;
  payment.addressIndex = created.addressIndex;
  await dbInsert("payments", {
    id: payment.id,
    profile_id: payment.merchantId,
    link_id: null,
    kind: payment.kind,
    title: payment.title,
    note: payment.note,
    amount_zatoshi: payment.amountZatoshi,
    address: payment.address,
    address_index: payment.addressIndex,
    memo: payment.memo,
    status: payment.status,
    received_zatoshi: payment.receivedZatoshi,
    txid: payment.txid,
    expires_at: payment.expiresAt,
    paid_at: payment.paidAt,
  });
  return payment;
}

export async function createLink(input: {
  merchantId: string;
  title: string;
  note: string;
  amountZec: string | null;
  maxPayments: number | null;
}) {
  const profile = await getProfile(input.merchantId);
  if (!profile) throw new Error("Save a viewing key in Settings first.");
  const title = input.title.trim();
  if (!title) throw new Error("A pay link needs a title.");
  let amount: string | null = null;
  if (input.amountZec && input.amountZec.trim()) {
    const zat = zecToZatoshi(input.amountZec);
    if (zat <= 0n) throw new Error("Amount must be greater than zero.");
    amount = zat.toString();
  }
  const link: PayLink = {
    id: nid("link"),
    merchantId: profile.id,
    merchantName: "Brass",
    title,
    note: input.note.trim(),
    amountZatoshi: amount,
    active: true,
    maxPayments: input.maxPayments && input.maxPayments > 0 ? Math.floor(input.maxPayments) : null,
    createdAt: new Date().toISOString(),
  };
  await dbInsert("pay_links", {
    id: link.id,
    profile_id: link.merchantId,
    title: link.title,
    note: link.note,
    amount_zatoshi: link.amountZatoshi,
    active: link.active,
    max_payments: link.maxPayments,
  });
  return link;
}

export async function openLinkPayment(linkId: string, amountZec: string | null) {
  const links = await dbGet<LinkRow[]>(`pay_links?id=eq.${encodeURIComponent(linkId)}&select=*`);
  const link = links[0] ? linkFrom(links[0]) : null;
  if (!link || !link.active) throw new Error("This pay link is not available.");
  const existing = await dbGet<PaymentRow[]>(
    `payments?link_id=eq.${encodeURIComponent(linkId)}&select=*&order=created_at.desc`,
  );
  const now = Date.now();
  const opened = existing.map(paymentFrom).filter((item) => expire(item, now).status !== "expired");
  if (link.maxPayments && opened.length >= link.maxPayments) {
    throw new Error("This pay link has reached its payment limit.");
  }
  let amount = link.amountZatoshi;
  if (!amount) {
    if (!amountZec) throw new Error("Enter an amount.");
    const zat = zecToZatoshi(amountZec);
    if (zat <= 0n) throw new Error("Amount must be greater than zero.");
    amount = zat.toString();
  }
  const profile = await getProfile(link.merchantId);
  if (!profile) throw new Error("This profile has no watcher.");
  const payment: Payment = {
    id: nid("pay"),
    merchantId: link.merchantId,
    merchantName: "Brass",
    kind: "link",
    linkId: link.id,
    title: link.title,
    note: link.note,
    amountZatoshi: amount,
    address: "",
    addressIndex: null,
    sharedAddress: false,
    memo: "",
    status: "open",
    receivedZatoshi: "0",
    txid: null,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    paidAt: null,
  };
  payment.memo = memoFor(payment.id);
  const created = await freshAddress(profile, payment.id);
  payment.address = created.address;
  payment.addressIndex = created.addressIndex;
  await dbInsert("payments", {
    id: payment.id,
    profile_id: payment.merchantId,
    link_id: payment.linkId,
    kind: payment.kind,
    title: payment.title,
    note: payment.note,
    amount_zatoshi: payment.amountZatoshi,
    address: payment.address,
    address_index: payment.addressIndex,
    memo: payment.memo,
    status: payment.status,
    received_zatoshi: payment.receivedZatoshi,
    expires_at: payment.expiresAt,
  });
  return payment;
}

async function reconcile(payment: Payment) {
  if (payment.status === "paid" || payment.status === "expired" || payment.addressIndex == null) return payment;
  const profile = await getProfile(payment.merchantId);
  if (!profile) return payment;
  try {
    const transfers = (
      await manager<{ transfers: Transfer[] }>(`/v1/accounts/${profile.watcherId}/transfers`, {
        method: "POST",
        body: { addressIndex: payment.addressIndex, txid: payment.txid },
      })
    ).transfers;
    const seen = new Set<string>();
    let total = 0n;
    let txid = payment.txid;
    for (const transfer of transfers) {
      const key = `${transfer.txid}:${transfer.amount}:${transfer.note}`;
      if (seen.has(key)) continue;
      seen.add(key);
      total += BigInt(transfer.amount || 0);
      if (transfer.txid) txid = transfer.txid;
    }
    apply(payment, total, txid);
    await dbUpdate(`payments`, `id=eq.${encodeURIComponent(payment.id)}`, paymentPatch(payment));
  } catch {
    return payment;
  }
  return payment;
}

export async function getPayment(id: string) {
  const rows = await dbGet<PaymentRow[]>(`payments?id=eq.${encodeURIComponent(id)}&select=*`);
  const payment = rows[0] ? paymentFrom(rows[0]) : null;
  if (!payment) return null;
  expire(payment, Date.now());
  if (payment.status === "expired") {
    await dbUpdate("payments", `id=eq.${encodeURIComponent(id)}`, { status: "expired" });
  }
  return reconcile(payment);
}

export async function getLink(id: string) {
  const links = await dbGet<LinkRow[]>(`pay_links?id=eq.${encodeURIComponent(id)}&select=*`);
  const link = links[0] ? linkFrom(links[0]) : null;
  if (!link) return null;
  const rows = await dbGet<PaymentRow[]>(
    `payments?link_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.desc`,
  );
  const now = Date.now();
  return { link, payments: rows.map(paymentFrom).map((item) => expire(item, now)) };
}

export async function markBroadcast(id: string, txid: string) {
  const clean = txid.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(clean)) throw new Error("Transaction id must be 64 hex characters.");
  const payment = await getPayment(id);
  if (!payment) throw new Error("Payment not found.");
  if (payment.status === "expired") throw new Error("This payment has expired.");
  if (payment.status !== "paid") {
    payment.txid = clean;
    payment.status = "broadcast";
    await dbUpdate("payments", `id=eq.${encodeURIComponent(id)}`, paymentPatch(payment));
  }
  return reconcile(payment);
}

export async function noteTx(txid: string) {
  const hits = (
    await manager<{ hits: Transfer[] }>("/v1/find", {
      method: "POST",
      body: { txid },
    })
  ).hits;
  const rows = await dbGet<PaymentRow[]>("payments?select=*&status=in.(open,broadcast,partial)&limit=200");
  const touched: Payment[] = [];
  for (const hit of hits) {
    const payment = rows.map(paymentFrom).find(
      (item) => (item.memo && hit.note.includes(item.memo)) || (item.address && item.address === hit.address),
    );
    if (!payment) continue;
    apply(payment, BigInt(hit.amount || 0), hit.txid || txid);
    await dbUpdate("payments", `id=eq.${encodeURIComponent(payment.id)}`, paymentPatch(payment));
    touched.push(payment);
  }
  return touched;
}

export function publicPayment(payment: Payment) {
  return {
    id: payment.id,
    kind: payment.kind,
    linkId: payment.linkId,
    merchantId: payment.merchantId,
    title: payment.title,
    note: payment.note,
    amountZec: payment.amountZatoshi ? zatoshiToZec(payment.amountZatoshi) : null,
    receivedZec: zatoshiToZec(payment.receivedZatoshi || "0"),
    address: payment.address,
    sharedAddress: false,
    memo: payment.memo,
    status: payment.status as PaymentStatus,
    txid: payment.txid,
    createdAt: payment.createdAt,
    expiresAt: payment.expiresAt,
    paidAt: payment.paidAt,
    merchantName: "Brass",
  };
}

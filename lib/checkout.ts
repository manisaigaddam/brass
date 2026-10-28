import { nid } from "./ids";
import { memoFor, zatoshiToZec, zecToZatoshi } from "./money";
import { withStore } from "./store";
import type { PayLink, Payment, PaymentStatus } from "./types";
import { createDiversifiedAddress, watcherConfigured } from "./walletd";

function merchantAddress(): string {
  const address = process.env.MERCHANT_UA?.trim() ?? "";
  if (!address) {
    throw new Error("Set MERCHANT_UA, or run zcash-walletd and set WALLETD_URL.");
  }
  if (!address.startsWith("u1")) {
    throw new Error("MERCHANT_UA must be a mainnet unified address starting with u1.");
  }
  return address;
}

function expire(payment: Payment, now: number): Payment {
  if (payment.status === "paid" || payment.status === "expired") return payment;
  if (payment.expiresAt && Date.parse(payment.expiresAt) <= now) {
    payment.status = "expired";
  }
  return payment;
}

async function assignAddress(payment: Payment): Promise<void> {
  if (watcherConfigured()) {
    const created = await createDiversifiedAddress(payment.id);
    if (created) {
      payment.address = created.address;
      payment.addressIndex = created.addressIndex;
      payment.sharedAddress = false;
      return;
    }
  }
  payment.address = merchantAddress();
  payment.addressIndex = null;
  payment.sharedAddress = true;
}

export async function createBill(input: {
  title: string;
  note: string;
  amountZec: string;
  expiresInHours: number;
}): Promise<Payment> {
  const amount = zecToZatoshi(input.amountZec);
  if (amount <= 0n) throw new Error("Amount must be greater than zero.");
  const title = input.title.trim();
  if (!title) throw new Error("A bill needs a title.");
  const hours = Number.isFinite(input.expiresInHours) ? input.expiresInHours : 24;
  const now = new Date();
  const payment: Payment = {
    id: nid("bill"),
    kind: "bill",
    linkId: null,
    title,
    note: input.note.trim(),
    amountZatoshi: amount.toString(),
    address: "",
    addressIndex: null,
    sharedAddress: true,
    memo: "",
    status: "open",
    receivedZatoshi: "0",
    txid: null,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + Math.max(1, hours) * 60 * 60 * 1000).toISOString(),
    paidAt: null,
  };
  payment.memo = memoFor(payment.id);
  await assignAddress(payment);
  await withStore((data) => {
    data.payments.unshift(payment);
  });
  return payment;
}

export async function createLink(input: {
  title: string;
  note: string;
  amountZec: string | null;
  maxPayments: number | null;
}): Promise<PayLink> {
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
    title,
    note: input.note.trim(),
    amountZatoshi: amount,
    active: true,
    maxPayments: input.maxPayments && input.maxPayments > 0 ? Math.floor(input.maxPayments) : null,
    createdAt: new Date().toISOString(),
  };
  await withStore((data) => {
    data.links.unshift(link);
  });
  return link;
}

export async function openLinkPayment(linkId: string, amountZec: string | null): Promise<Payment> {
  const draft = await withStore((data) => {
    const link = data.links.find((item) => item.id === linkId);
    if (!link || !link.active) throw new Error("This pay link is not available.");
    const now = Date.now();
    const opened = data.payments.filter((item) => item.linkId === link.id && expire(item, now).status !== "expired");
    if (link.maxPayments && opened.length >= link.maxPayments) {
      throw new Error("This pay link has reached its payment limit.");
    }
    const amountSource = link.amountZatoshi ? null : amountZec;
    let amount = link.amountZatoshi;
    if (!amount) {
      if (!amountSource) throw new Error("Enter an amount.");
      const zat = zecToZatoshi(amountSource);
      if (zat <= 0n) throw new Error("Amount must be greater than zero.");
      amount = zat.toString();
    }
    const payment: Payment = {
      id: nid("pay"),
      kind: "link",
      linkId: link.id,
      title: link.title,
      note: link.note,
      amountZatoshi: amount,
      address: "",
      addressIndex: null,
      sharedAddress: true,
      memo: "",
      status: "open",
      receivedZatoshi: "0",
      txid: null,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      paidAt: null,
    };
    payment.memo = memoFor(payment.id);
    return payment;
  });
  await assignAddress(draft);
  await withStore((data) => {
    data.payments.unshift(draft);
  });
  return draft;
}

export async function listDesk(): Promise<{ bills: Payment[]; links: PayLink[] }> {
  return withStore((data) => {
    const now = Date.now();
    data.payments.forEach((payment) => expire(payment, now));
    return {
      bills: data.payments.filter((payment) => payment.kind === "bill"),
      links: data.links,
    };
  });
}

export async function getPayment(id: string): Promise<Payment | null> {
  return withStore((data) => {
    const payment = data.payments.find((item) => item.id === id) ?? null;
    return payment ? expire(payment, Date.now()) : null;
  });
}

export async function getLink(id: string): Promise<{ link: PayLink; payments: Payment[] } | null> {
  return withStore((data) => {
    const link = data.links.find((item) => item.id === id);
    if (!link) return null;
    const now = Date.now();
    const payments = data.payments.filter((item) => item.linkId === id).map((item) => expire(item, now));
    return { link, payments };
  });
}

export async function markBroadcast(id: string, txid: string): Promise<Payment> {
  const clean = txid.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(clean)) throw new Error("Transaction id must be 64 hex characters.");
  return withStore((data) => {
    const payment = data.payments.find((item) => item.id === id);
    if (!payment) throw new Error("Payment not found.");
    expire(payment, Date.now());
    if (payment.status === "expired") throw new Error("This payment has expired.");
    if (payment.status !== "paid") {
      payment.txid = clean;
      payment.status = "broadcast";
    }
    return payment;
  });
}

export function publicPayment(payment: Payment) {
  return {
    id: payment.id,
    kind: payment.kind,
    linkId: payment.linkId,
    title: payment.title,
    note: payment.note,
    amountZec: payment.amountZatoshi ? zatoshiToZec(payment.amountZatoshi) : null,
    receivedZec: zatoshiToZec(payment.receivedZatoshi),
    address: payment.address,
    sharedAddress: payment.sharedAddress,
    memo: payment.memo,
    status: payment.status as PaymentStatus,
    txid: payment.txid,
    createdAt: payment.createdAt,
    expiresAt: payment.expiresAt,
    paidAt: payment.paidAt,
    merchantName: process.env.MERCHANT_NAME?.trim() || "Brass",
  };
}

import { zatoshiToZec } from "./money";
import { withStore } from "./store";
import type { Payment } from "./types";
import { incomingForIndex, transfersForTx, watcherConfigured, type Transfer } from "./walletd";

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

function matches(payment: Payment, address: string, note: string): boolean {
  if (payment.memo && note.includes(payment.memo)) return true;
  if (!payment.sharedAddress && payment.address && address === payment.address) return true;
  return false;
}

function transferKey(transfer: Transfer): string {
  return `${transfer.txid ?? ""}:${transfer.address ?? ""}:${transfer.amount ?? 0}:${transfer.note ?? ""}`;
}

export async function reconcilePayment(id: string): Promise<Payment | null> {
  if (!watcherConfigured()) return null;
  const snapshot = await withStore((data) => data.payments.find((item) => item.id === id) ?? null);
  if (!snapshot || snapshot.status === "paid" || snapshot.status === "expired") return snapshot;
  if (snapshot.addressIndex == null && !snapshot.txid) return snapshot;

  const found: Transfer[] = [];
  try {
    if (snapshot.addressIndex != null) {
      found.push(...(await incomingForIndex(snapshot.addressIndex)));
    }
    if (snapshot.txid) {
      const extra = await transfersForTx(snapshot.txid);
      for (const transfer of extra) {
        if (matches(snapshot, transfer.address ?? "", transfer.note ?? "")) found.push(transfer);
      }
    }
  } catch {
    return snapshot;
  }
  if (found.length === 0) return snapshot;

  const seen = new Set<string>();
  let total = 0n;
  let txid: string | null = snapshot.txid;
  for (const transfer of found) {
    const key = transferKey(transfer);
    if (seen.has(key)) continue;
    seen.add(key);
    total += BigInt(transfer.amount ?? 0);
    if (transfer.txid) txid = transfer.txid;
  }

  return withStore((data) => {
    const payment = data.payments.find((item) => item.id === id);
    if (!payment) return null;
    apply(payment, total, txid);
    return payment;
  });
}

export async function reconcileTxid(txid: string): Promise<Payment[]> {
  if (!watcherConfigured()) return [];
  const transfers = await transfersForTx(txid);
  return withStore((data) => {
    const touched: Payment[] = [];
    for (const transfer of transfers) {
      const note = transfer.note ?? "";
      const address = transfer.address ?? "";
      const amount = BigInt(transfer.amount ?? 0);
      const payment = data.payments.find((item) => matches(item, address, note));
      if (!payment) continue;
      apply(payment, amount, transfer.txid || txid);
      touched.push(payment);
    }
    return touched;
  });
}

export function paymentAmount(payment: Payment): string | null {
  return payment.amountZatoshi ? zatoshiToZec(payment.amountZatoshi) : null;
}

import { NextResponse } from "next/server";
import { publicPayment } from "@/lib/checkout";
import { reconcileTxid } from "@/lib/reconcile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ txid: string }> }) {
  try {
    const { txid } = await context.params;
    const payments = await reconcileTxid(txid);
    return NextResponse.json({ payments: payments.map(publicPayment) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Watcher lookup failed.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

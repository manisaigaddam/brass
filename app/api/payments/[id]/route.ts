import { NextResponse } from "next/server";
import { getPayment, markBroadcast, publicPayment } from "@/lib/checkout";
import { reconcilePayment, reconcileTxid } from "@/lib/reconcile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await reconcilePayment(id);
  const payment = await getPayment(id);
  if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  return NextResponse.json({ payment: publicPayment(payment) });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json()) as { action?: string; txid?: string };
  try {
    if (body.action === "broadcast") {
      const payment = await markBroadcast(id, body.txid ?? "");
      if (payment.txid) {
        try {
          await reconcileTxid(payment.txid);
        } catch {
          // The broadcast is saved even when the watcher is offline.
        }
      }
      const fresh = await getPayment(id);
      return NextResponse.json({ payment: publicPayment(fresh ?? payment) });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update the payment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

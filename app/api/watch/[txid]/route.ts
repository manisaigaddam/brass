import { NextResponse } from "next/server";
import { noteTx, publicPayment } from "@/lib/checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ txid: string }> }) {
  try {
    const { txid } = await context.params;
    const payments = await noteTx(txid);
    return NextResponse.json({ payments: payments.map(publicPayment) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Watcher lookup failed.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

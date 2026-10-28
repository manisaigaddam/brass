import { NextResponse } from "next/server";
import { getPayment, markBroadcast, publicPayment } from "@/lib/checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const payment = await getPayment(id);
    if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    return NextResponse.json({ payment: publicPayment(payment) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment not found.";
    const status = message === "Payment not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json()) as { action?: string; txid?: string };
  try {
    if (body.action === "broadcast") {
      const payment = await markBroadcast(id, body.txid ?? "");
      return NextResponse.json({ payment: publicPayment(payment) });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update the payment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

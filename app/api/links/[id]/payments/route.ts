import { NextResponse } from "next/server";
import { openLinkPayment, publicPayment } from "@/lib/checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { amountZec?: string | null };
    const payment = await openLinkPayment(id, body.amountZec ?? null);
    return NextResponse.json({ payment: publicPayment(payment) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start the payment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

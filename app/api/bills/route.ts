import { NextResponse } from "next/server";
import { merchantAllowed } from "@/lib/auth";
import { createBill, publicPayment } from "@/lib/checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await merchantAllowed(request))) {
    return NextResponse.json({ error: "Desk login required." }, { status: 401 });
  }
  try {
    const body = (await request.json()) as {
      title?: string;
      note?: string;
      amountZec?: string;
      expiresInHours?: number;
    };
    const payment = await createBill({
      title: body.title ?? "",
      note: body.note ?? "",
      amountZec: body.amountZec ?? "",
      expiresInHours: Number(body.expiresInHours ?? 24),
    });
    return NextResponse.json({ payment: publicPayment(payment) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create the bill.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

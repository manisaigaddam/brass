import { NextResponse } from "next/server";
import { merchantAllowed } from "@/lib/auth";
import { createLink } from "@/lib/checkout";
import { zatoshiToZec } from "@/lib/money";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await merchantAllowed(request))) {
    return NextResponse.json({ error: "Desk login required." }, { status: 401 });
  }
  try {
    const body = (await request.json()) as {
      merchantId?: string;
      title?: string;
      note?: string;
      amountZec?: string | null;
      maxPayments?: number | null;
    };
    const link = await createLink({
      merchantId: body.merchantId ?? "",
      title: body.title ?? "",
      note: body.note ?? "",
      amountZec: body.amountZec ?? null,
      maxPayments: body.maxPayments ?? null,
    });
    return NextResponse.json({
      link: {
        ...link,
        amountZec: link.amountZatoshi ? zatoshiToZec(link.amountZatoshi) : null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create the pay link.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

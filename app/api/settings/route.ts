import { NextResponse } from "next/server";
import { saveProfile } from "@/lib/checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { ufvk?: string };
    const profile = await saveProfile({ ufvk: body.ufvk ?? "" });
    return NextResponse.json({ profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save the viewing key.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

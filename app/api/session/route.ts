import { NextResponse } from "next/server";
import { merchantSecret } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = merchantSecret();
  if (!secret) return NextResponse.json({ ok: true });
  const body = (await request.json()) as { secret?: string };
  if (body.secret !== secret) {
    return NextResponse.json({ error: "Wrong desk key." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set("brass_desk", secret, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

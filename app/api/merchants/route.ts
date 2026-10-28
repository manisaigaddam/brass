import { NextResponse } from "next/server";

export function POST() {
  return NextResponse.json({ error: "Save the viewing key from Settings." }, { status: 410 });
}

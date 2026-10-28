import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const secret = process.env.MERCHANT_SECRET?.trim();
  if (!secret) return NextResponse.next();
  const { pathname } = request.nextUrl;
  const desk =
    pathname === "/" ||
    pathname.startsWith("/bills") ||
    pathname.startsWith("/links") ||
    pathname.startsWith("/m") ||
    pathname.startsWith("/settings");
  if (!desk) return NextResponse.next();
  if (request.cookies.get("brass_desk")?.value === secret) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/enter";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/", "/bills/:path*", "/links/:path*", "/m/:path*", "/settings"],
};

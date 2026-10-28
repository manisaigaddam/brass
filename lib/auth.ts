import { cookies } from "next/headers";

export function merchantSecret(): string | null {
  const secret = process.env.MERCHANT_SECRET?.trim();
  return secret ? secret : null;
}

export async function merchantAllowed(request?: Request): Promise<boolean> {
  const secret = merchantSecret();
  if (!secret) return true;
  const header = request?.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  const jar = await cookies();
  return jar.get("brass_desk")?.value === secret;
}

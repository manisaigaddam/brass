function base64url(text: string): string {
  return Buffer.from(text, "utf8").toString("base64url");
}

export function zip321(input: {
  address: string;
  amountZec?: string | null;
  memo?: string | null;
  message?: string | null;
  label?: string | null;
}): string {
  const params = new URLSearchParams();
  if (input.amountZec) params.set("amount", input.amountZec);
  if (input.memo) params.set("memo", base64url(input.memo));
  if (input.message) params.set("message", input.message);
  if (input.label) params.set("label", input.label);
  const query = params.toString();
  return query ? `zcash:${input.address}?${query}` : `zcash:${input.address}`;
}

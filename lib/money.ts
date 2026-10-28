const ZAT = 100_000_000n;

export function zecToZatoshi(input: string): bigint {
  const value = input.trim();
  if (!/^\d+(\.\d{1,8})?$/.test(value)) {
    throw new Error("Amount must be ZEC with at most 8 decimal places.");
  }
  const [whole, frac = ""] = value.split(".");
  const padded = (frac + "00000000").slice(0, 8);
  return BigInt(whole) * ZAT + BigInt(padded);
}

export function zatoshiToZec(value: bigint | string): string {
  const zat = typeof value === "string" ? BigInt(value) : value;
  const negative = zat < 0n;
  const abs = negative ? -zat : zat;
  const whole = abs / ZAT;
  const frac = (abs % ZAT).toString().padStart(8, "0").replace(/0+$/, "");
  const text = frac ? `${whole}.${frac}` : whole.toString();
  return negative ? `-${text}` : text;
}

export function memoFor(paymentId: string): string {
  return `pay:${paymentId}`;
}

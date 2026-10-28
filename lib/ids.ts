import { randomBytes } from "crypto";

export function nid(prefix: "bill" | "link" | "pay" | "mer"): string {
  return `${prefix}_${randomBytes(6).toString("hex")}`;
}

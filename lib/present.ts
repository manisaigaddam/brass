import QRCode from "qrcode";
import { zatoshiToZec } from "./money";
import type { Payment } from "./types";
import { zip321 } from "./zip321";

export async function presentPayment(payment: Payment) {
  const amountZec = payment.amountZatoshi ? zatoshiToZec(payment.amountZatoshi) : null;
  const label = payment.merchantName || "Brass";
  const uri = payment.address
    ? zip321({
        address: payment.address,
        amountZec,
        memo: payment.memo,
        message: payment.note || payment.title,
        label,
      })
    : "";
  const qr = uri
    ? await QRCode.toString(uri, {
        type: "svg",
        margin: 1,
        width: 280,
        color: { dark: "#231F20", light: "#F7F1E6" },
      })
    : "";
  return { amountZec, uri, qr, merchantName: label };
}

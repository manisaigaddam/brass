import Link from "next/link";
import { notFound } from "next/navigation";
import { PayBox } from "@/components/PayBox";
import { Mark } from "@/components/Mark";
import { getPayment, publicPayment } from "@/lib/checkout";
import { presentPayment } from "@/lib/present";

export const dynamic = "force-dynamic";

export default async function BillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payment = await getPayment(id);
  if (!payment || payment.kind !== "bill") notFound();
  const view = await presentPayment(payment);
  return (
    <main className="desk">
      <Link className="brand" href="/">
        <Mark />
        <strong>Brass</strong>
      </Link>
      <p className="lede">
        Payer page: <a href={`/pay/${payment.id}`}>{`/pay/${payment.id}`}</a>
      </p>
      <PayBox initial={publicPayment(payment)} uri={view.uri} qr={view.qr} />
    </main>
  );
}

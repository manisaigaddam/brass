import { notFound } from "next/navigation";
import { PayBox } from "@/components/PayBox";
import { getPayment, publicPayment } from "@/lib/checkout";
import { presentPayment } from "@/lib/present";

export const dynamic = "force-dynamic";

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payment = await getPayment(id);
  if (!payment) notFound();
  const view = await presentPayment(payment);
  return (
    <main className="payer">
      <PayBox initial={publicPayment(payment)} uri={view.uri} qr={view.qr} />
    </main>
  );
}

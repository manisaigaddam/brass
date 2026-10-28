import Link from "next/link";
import { CreateBillForm } from "@/components/CreateBillForm";
import { Mark } from "@/components/Mark";

export default async function NewMerchantBillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="desk">
      <Link className="brand" href={`/m/${id}`}>
        <Mark />
        <strong>Brass</strong>
      </Link>
      <h1>New bill</h1>
      <p className="lede">One payer. One new address from the viewing key in Settings. It closes when that payment arrives.</p>
      <CreateBillForm merchantId={id} />
    </main>
  );
}

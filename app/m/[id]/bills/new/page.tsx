import { CreateBillForm } from "@/components/CreateBillForm";

export default async function NewMerchantBillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="page">
      <h1>New bill</h1>
      <p className="lede">One charge, one payer, one address. It closes when that amount arrives.</p>
      <CreateBillForm merchantId={id} />
    </main>
  );
}

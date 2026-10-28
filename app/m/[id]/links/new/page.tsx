import { CreateLinkForm } from "@/components/CreateLinkForm";

export default async function NewMerchantLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="page">
      <h1>New pay link</h1>
      <p className="lede">Share one URL. Each person who continues gets their own payment and address.</p>
      <CreateLinkForm merchantId={id} />
    </main>
  );
}

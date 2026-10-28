import Link from "next/link";
import { CreateLinkForm } from "@/components/CreateLinkForm";
import { Mark } from "@/components/Mark";

export default async function NewMerchantLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="desk">
      <Link className="brand" href={`/m/${id}`}>
        <Mark />
        <strong>Brass</strong>
      </Link>
      <h1>New pay link</h1>
      <p className="lede">Share one URL. Every person who presses Pay gets a separate bill and a separate address.</p>
      <CreateLinkForm merchantId={id} />
    </main>
  );
}

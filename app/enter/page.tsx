import { Suspense } from "react";
import { EnterForm } from "@/components/EnterForm";

export default function EnterPage() {
  return (
    <main className="page">
      <h1>Locked</h1>
      <p className="lede">Enter the desk key to create bills and pay links. Payment pages stay open.</p>
      <Suspense>
        <EnterForm />
      </Suspense>
    </main>
  );
}

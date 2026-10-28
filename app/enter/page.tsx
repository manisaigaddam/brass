import { Suspense } from "react";
import { EnterForm } from "@/components/EnterForm";
import { Mark } from "@/components/Mark";

export default function EnterPage() {
  return (
    <main className="setup">
      <Mark />
      <h1>Desk</h1>
      <p className="lede">The payer pages stay open. This key only locks bill and pay-link creation.</p>
      <Suspense>
        <EnterForm />
      </Suspense>
    </main>
  );
}

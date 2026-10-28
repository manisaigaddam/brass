import { ProfileLink } from "@/components/ProfileLink";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="page">
      <h1>Invoices</h1>
      <p className="lede">
        A bill collects one payment and then closes. A pay link stays up, and each person who opens it gets their own
        invoice.
      </p>
      <ProfileLink />
    </main>
  );
}

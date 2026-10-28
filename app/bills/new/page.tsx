import Link from "next/link";
import { Mark } from "@/components/Mark";

export default function NewBillPage() {
  return (
    <main className="desk">
      <Link className="brand" href="/">
        <Mark />
        <strong>Brass</strong>
      </Link>
      <h1>Save a viewing key first</h1>
      <p className="lede">A bill uses the key already stored in Settings. It is not entered again for each bill.</p>
      <Link className="button" href="/settings">
        Settings
      </Link>
    </main>
  );
}

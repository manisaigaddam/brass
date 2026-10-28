import Link from "next/link";

export default function NewBillPage() {
  return (
    <main className="page">
      <h1>Save a viewing key first</h1>
      <p className="lede">Bills use the key in Settings. The title you type is the name of the charge.</p>
      <Link className="button" href="/settings">
        Settings
      </Link>
    </main>
  );
}

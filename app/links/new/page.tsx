import Link from "next/link";

export default function NewLinkPage() {
  return (
    <main className="page">
      <h1>Save a viewing key first</h1>
      <p className="lede">Pay links use the key in Settings. Each customer still gets a separate payment.</p>
      <Link className="button" href="/settings">
        Settings
      </Link>
    </main>
  );
}

import Link from "next/link";
import { Mark } from "@/components/Mark";

export default function NewLinkPage() {
  return (
    <main className="desk">
      <Link className="brand" href="/">
        <Mark />
        <strong>Brass</strong>
      </Link>
      <h1>Save a viewing key first</h1>
      <p className="lede">A pay link uses the key already stored in Settings. It is not entered again for each link.</p>
      <Link className="button" href="/settings">
        Settings
      </Link>
    </main>
  );
}

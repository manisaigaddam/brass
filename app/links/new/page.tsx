import Link from "next/link";
import { CreateLinkForm } from "@/components/CreateLinkForm";
import { Mark } from "@/components/Mark";

export default function NewLinkPage() {
  return (
    <main className="desk">
      <Link className="brand" href="/">
        <Mark />
        <strong>Brass</strong>
      </Link>
      <h1>New pay link</h1>
      <p className="lede">
        Share one URL. Each person who presses Pay gets a separate bill. You see every payment. They see their own.
      </p>
      <CreateLinkForm />
    </main>
  );
}

import Link from "next/link";
import { Mark } from "@/components/Mark";
import { SettingsForm } from "@/components/SettingsForm";

export default function SettingsPage() {
  return (
    <main className="desk">
      <Link className="brand" href="/">
        <Mark />
        <strong>Brass</strong>
      </Link>
      <h1>Settings</h1>
      <p className="lede">
        The viewing key is saved once. Bills and pay links use it after that, and each one has its own title. The key
        cannot spend.
      </p>
      <SettingsForm />
    </main>
  );
}

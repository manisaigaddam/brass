import { SettingsForm } from "@/components/SettingsForm";

export default function SettingsPage() {
  return (
    <main className="page">
      <h1>Settings</h1>
      <p className="lede">
        Paste the viewing key once. Brass uses it to watch for payment. It cannot spend, and this site does not store
        a copy after the watcher has it.
      </p>
      <SettingsForm />
    </main>
  );
}

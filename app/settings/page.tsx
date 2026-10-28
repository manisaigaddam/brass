import { SettingsForm } from "@/components/SettingsForm";

export default function SettingsPage() {
  return (
    <main className="page">
      <h1>Settings</h1>
      <p className="lede">
        Paste the viewing key once. Bills and pay links use it after that. The key cannot spend, and the website does
        not keep a copy.
      </p>
      <SettingsForm />
    </main>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function SettingsForm() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("brass.profile");
    if (!raw) return;
    const profile = JSON.parse(raw) as { id?: string };
    if (profile.id) setSaved(true);
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ufvk: form.get("ufvk") }),
    });
    const data = (await response.json()) as { error?: string; profile?: { id: string } };
    setBusy(false);
    if (!response.ok || !data.profile) {
      setError(data.error || "Could not save the viewing key.");
      return;
    }
    localStorage.setItem("brass.profile", JSON.stringify({ id: data.profile.id }));
    router.push(`/m/${data.profile.id}`);
    router.refresh();
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      {saved ? <p>This browser already has a viewing key. Saving again replaces it.</p> : null}
      <label>
        Unified Full Viewing Key
        <textarea name="ufvk" required rows={4} placeholder="uview..." spellCheck={false} />
      </label>
      <p className="fine">
        Once. A bill or a pay link uses this key and carries its own title. The website does not keep the key. The
        watcher on AWS reads the latest block itself.
      </p>
      {error ? <p className="error">{error}</p> : null}
      <button className="button" type="submit" disabled={busy}>
        {busy ? "Asking the watcher to start" : "Save viewing key"}
      </button>
    </form>
  );
}

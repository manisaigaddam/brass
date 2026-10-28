"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function EnterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret: form.get("secret") }),
    });
    if (!response.ok) {
      setError("That key does not match.");
      return;
    }
    router.push(params.get("next") || "/");
    router.refresh();
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <label>
        Desk key
        <input name="secret" type="password" required />
      </label>
      {error ? <p className="error">{error}</p> : null}
      <button className="button" type="submit">
        Open the desk
      </button>
    </form>
  );
}

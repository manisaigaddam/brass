"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function ProfileLink({ look = "button" }: { look?: "button" | "text" | "gold" }) {
  const [href, setHref] = useState("/settings");
  const [label, setLabel] = useState(look === "text" ? "Invoices" : "Set up");

  useEffect(() => {
    const raw = localStorage.getItem("brass.profile");
    if (!raw) return;
    const profile = JSON.parse(raw) as { id?: string };
    if (!profile.id) return;
    setHref(`/m/${profile.id}`);
    setLabel(look === "text" ? "Invoices" : "Open invoices");
  }, [look]);

  const className = look === "text" ? undefined : look === "gold" ? "button gold" : "button";

  return (
    <Link className={className} href={href}>
      {label}
    </Link>
  );
}

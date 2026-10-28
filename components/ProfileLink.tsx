"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function ProfileLink() {
  const [href, setHref] = useState("/settings");
  const [label, setLabel] = useState("Settings");

  useEffect(() => {
    const raw = localStorage.getItem("brass.profile");
    if (!raw) return;
    const profile = JSON.parse(raw) as { id?: string };
    if (profile.id) {
      setHref(`/m/${profile.id}`);
      setLabel("Your payments");
    }
  }, []);

  return (
    <Link className="button" href={href}>
      {label}
    </Link>
  );
}

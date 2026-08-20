"use client";

import { useEffect, useState } from "react";
import { TurnbineApp } from "../turnbine-app";

export function CreatorClient() {
  const [mounted, setMounted] = useState(false);
  // The editor depends on browser media APIs, so reveal it only after hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  if (!mounted)
    return (
      <main className="creator-route-loading" aria-live="polite">
        <p>Loading Turnbine creator…</p>
      </main>
    );
  return <TurnbineApp />;
}

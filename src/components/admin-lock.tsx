"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { lockAction, unlockAction } from "@/lib/actions";
import type { WriteMode } from "@/lib/access";

export function AdminLock({ mode }: { mode: WriteMode }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (mode === "open") return null;

  if (mode === "unconfigured") {
    return <span className="small faint">Writes need ADMIN_PASSWORD</span>;
  }

  if (mode === "unlocked") {
    return (
      <button
        className="text-btn"
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => {
          await lockAction();
          router.refresh();
        })}
      >
        Lock editing
      </button>
    );
  }

  return (
    <form
      className="admin-form"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        startTransition(async () => {
          const result = await unlockAction(password);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setPassword("");
          router.refresh();
        });
      }}
    >
      <input
        type="password"
        name="password"
        autoComplete="current-password"
        placeholder="Admin password"
        aria-label="Admin password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <button className="text-btn" type="submit" disabled={pending || password.length === 0}>Unlock</button>
      {error ? <span className="small">{error}</span> : null}
    </form>
  );
}

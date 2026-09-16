"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Unable to sign in.");
      router.replace("/admin");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in.");
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <form className="login-card" onSubmit={login}>
        <p className="eyebrow">Private workspace</p>
        <h1>Ask Me Admin</h1>
        <p>Enter the server-configured administrator secret.</p>
        {!configured && (
          <p className="configuration-warning">
            Admin access is disabled until an administrator secret is configured on the server.
          </p>
        )}
        <label htmlFor="admin-secret">Admin secret</label>
        <input
          id="admin-secret"
          type="password"
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
          autoComplete="current-password"
          disabled={!configured || loading}
          required
        />
        {error && <p className="error-message">{error}</p>}
        <button className="primary-button" type="submit" disabled={!configured || loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}

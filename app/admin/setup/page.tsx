"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminSetupPage() {
  const router = useRouter(); const [username, setUsername] = useState(""); const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (password !== confirm) { setMessage("Passwords do not match."); return; } setBusy(true); setMessage(""); const response = await fetch("/api/admin/setup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username, password }) }); const result = await response.json() as { error?: string }; setBusy(false); if (!response.ok) { setMessage(result.error || "Could not create administrator."); return; } router.push("/admin/login"); };
  return <main className="admin-auth-page"><section className="admin-auth-card"><span className="brand">Motion<span>Mint</span></span><p className="auth-eyebrow">Local first-time setup</p><h1>Create administrator</h1><p>This closes permanently after the first admin account is created.</p><form onSubmit={submit}><label>Admin username<input required minLength={4} autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} /></label><label>Password<input required minLength={12} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><label>Confirm password<input required minLength={12} type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} /></label>{message && <p className="auth-error" role="alert">{message}</p>}<button className="auth-submit" disabled={busy}>{busy ? "Creating…" : "Create admin →"}</button></form><div className="admin-auth-links"><Link href="/admin/login">Back to admin login</Link></div></section></main>;
}

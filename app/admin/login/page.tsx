"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../../lib/auth-client";

export default function AdminLoginPage() {
  const router = useRouter(); const [username, setUsername] = useState(""); const [password, setPassword] = useState(""); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); setMessage(""); const result = await authClient.signIn.username({ username, password }); if (result.error) { setBusy(false); setMessage("Invalid administrator credentials."); return; } const check = await fetch("/api/admin/session").then((response) => response.json()) as { admin?: boolean }; if (!check.admin) { await authClient.signOut(); setBusy(false); setMessage("This account does not have administrator access."); return; } router.push("/admin"); router.refresh(); };
  return <main className="admin-auth-page"><section className="admin-auth-card"><span className="brand">Motion<span>Mint</span></span><p className="auth-eyebrow">Secure administration</p><h1>Template Admin</h1><p>Use your dedicated administrator username and password.</p><form onSubmit={submit}><label>Username<input required autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} /></label><label>Password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{message && <p className="auth-error" role="alert">{message}</p>}<button className="auth-submit" disabled={busy}>{busy ? "Checking…" : "Enter admin →"}</button></form><div className="admin-auth-links"><Link href="/admin/setup">First-time setup</Link><Link href="/">Public website</Link></div></section></main>;
}

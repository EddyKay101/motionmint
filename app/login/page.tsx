"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [google, setGoogle] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  useEffect(() => { void fetch("/api/auth/config").then((response) => response.json()).then((data: { google?: boolean }) => setGoogle(Boolean(data.google))).catch(() => setGoogle(false)); }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage("");
    const result = mode === "register"
      ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password, callbackURL: "/create" })
      : await authClient.signIn.email({ email: email.trim(), password, callbackURL: "/create" });
    setBusy(false);
    if (result.error) { setMessage(result.error.message || "Could not authenticate."); return; }
    router.push("/create"); router.refresh();
  };
  return <main className="auth-page"><section className="auth-art"><Link className="auth-brand" href="/">Motion<span>Mint</span><i /></Link><div><p>YOUR IDEAS, IN MOTION</p><h1>Create once.<br /><em>Move everywhere.</em></h1><div className="auth-mini-banner"><span>9:16 · SOCIAL STORY</span><b>Make the<br />moment move.</b><i /></div></div><small>Private projects · Secure sessions · Your creative space</small></section>
    <section className="auth-panel"><div className="auth-card"><p className="auth-eyebrow">MotionMint account</p><h2>{mode === "login" ? "Welcome back." : "Create your account."}</h2><p className="auth-copy">{mode === "login" ? "Sign in to continue building and saving your projects." : "Register to keep projects connected across devices."}</p>
      <div className="auth-tabs"><button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setMessage(""); }}>Sign in</button><button className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setMessage(""); }}>Register</button></div>
      <button className="google-auth" type="button" disabled={!google || busy} onClick={() => void authClient.signIn.social({ provider: "google", callbackURL: "/create" })}><b>G</b>{google ? "Continue with Google" : "Google login needs configuration"}</button>
      <div className="auth-divider"><span>or use email</span></div>
      <form onSubmit={submit}>{mode === "register" && <label>Your name<input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Alex Morgan" /></label>}<label>Email address<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label><label>Password<input required minLength={10} type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 10 characters" /></label>{message && <p className="auth-error" role="alert">{message}</p>}<button className="auth-submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in →" : "Create account →"}</button></form>
      <Link className="auth-back" href="/">← Back to MotionMint</Link></div></section></main>;
}

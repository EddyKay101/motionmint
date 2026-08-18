"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "../../lib/auth-client";

export default function AccountPage() {
  const router = useRouter(); const { data, isPending } = authClient.useSession();
  if (isPending) return <main className="account-page"><p>Loading account…</p></main>;
  if (!data) return <main className="account-page"><div className="account-card"><h1>You’re not signed in.</h1><Link className="auth-submit" href="/login">Sign in →</Link></div></main>;
  return <main className="account-page"><div className="account-card"><Link className="auth-brand dark" href="/">Motion<span>Mint</span><i /></Link><p className="auth-eyebrow">Your account</p><div className="account-avatar">{data.user.name?.slice(0, 1).toUpperCase() || "M"}</div><h1>{data.user.name}</h1><p>{data.user.email}</p><div className="account-actions"><Link href="/create">Open creator →</Link><button onClick={() => void authClient.signOut({ fetchOptions: { onSuccess: () => { router.push("/"); router.refresh(); } } })}>Sign out</button></div></div></main>;
}

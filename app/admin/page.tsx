import type { Metadata } from "next";
import { AdminApp } from "./admin-app";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "../../lib/auth";

export const metadata: Metadata = {
  title: "Template Admin · MotionMint",
  description: "Local template catalogue administration for MotionMint.",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if ((session?.user as { role?: string } | undefined)?.role !== "admin") redirect("/admin/login");
  return <AdminApp />;
}

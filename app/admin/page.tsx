import type { Metadata } from "next";
import { AdminApp } from "./admin-app";

export const metadata: Metadata = {
  title: "Template Admin · MotionMint",
  description: "Local template catalogue administration for MotionMint.",
};

export default function AdminPage() {
  return <AdminApp />;
}

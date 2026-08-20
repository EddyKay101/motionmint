import type { Metadata } from "next";
import { EmailCreator } from "./email-creator";

export const metadata: Metadata = {
  title: "Create email · MotionMint",
  description: "Customise a responsive MotionMint email template.",
};

export default async function EmailCreatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EmailCreator templateId={id} />;
}

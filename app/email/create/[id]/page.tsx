import type { Metadata } from "next";
import { EmailCreator } from "./email-creator";

export const metadata: Metadata = {
  title: "Create email · Turnbine",
  description: "Customise a responsive Turnbine email template.",
};

export default async function EmailCreatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EmailCreator templateId={id} />;
}

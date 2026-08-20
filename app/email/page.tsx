import type { Metadata } from "next";
import { EmailTemplateGallery } from "./template-gallery";

export const metadata: Metadata = {
  title: "Email templates · Turnbine",
  description: "Choose a responsive email design and make it yours.",
};

export default function EmailTemplatesPage() {
  return <EmailTemplateGallery />;
}

import type { Metadata } from "next";
import { CreatorClient } from "./creator-client";

export const metadata: Metadata = {
  title: "Create · Turnbine",
  description: "Create animated banners, social campaigns and lyric videos.",
};

export default function CreatePage() {
  return <CreatorClient />;
}

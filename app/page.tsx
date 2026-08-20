import type { Metadata } from "next";
import { Showcase } from "./showcase";

export const metadata: Metadata = {
  title: "Turnbine — make your message move",
  description: "Create animated social posts, display ads, lyric videos and digital campaigns from one mobile-first studio.",
};

export default function Home() {
  return <Showcase />;
}

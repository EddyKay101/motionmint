import type { Metadata } from "next";
import { MotionMintApp } from "./motion-mint-app";

export const metadata: Metadata = {
  title: "MotionMint — animated social content studio",
  description: "Create animated social banners and lyric videos from any device.",
};

export default function Home() {
  return <MotionMintApp />;
}

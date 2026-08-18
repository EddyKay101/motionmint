import type { Metadata } from "next";
import { MotionMintApp } from "../motion-mint-app";

export const metadata: Metadata = {
  title: "Create · MotionMint",
  description: "Create animated banners, social campaigns and lyric videos.",
};

export default function CreatePage() { return <MotionMintApp />; }

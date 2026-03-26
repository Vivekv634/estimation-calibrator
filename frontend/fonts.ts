import { Outfit } from "next/font/google";

export const outfit = Outfit({
  weight: ["400", "500", "600"],
  adjustFontFallback: true,
  subsets: ["latin"],
  preload: true,
  style: "normal",
});

import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { cn } from "@/lib/utils";
import { outfit } from "@/fonts";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Estimation Calibrator",
  description: "Track your time estimates vs actuals and improve over time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <nav className="bg-white border-b border-gray-200">
          <div
            className={cn(
              outfit.className,
              "max-w-3xl mx-auto px-4 flex gap-10 h-16 items-center justify-center",
            )}
          >
            <Link
              href={"/"}
              className="font-semibold text-[#006239]/70 border-b-2 border-transparent hover:border-accent-foreground duration-100"
            >
              EstiCalib
            </Link>
            <Link
              href="/log"
              className="text-normal text-black hover:text-[#006239]/70 border-b-2 border-transparent hover:border-black duration-100"
            >
              Log
            </Link>
            <Link
              href="/history"
              className="text-normal text-black hover:text-[#006239]/70 border-b-2 border-transparent hover:border-black duration-100"
            >
              History
            </Link>
            <Link
              href="/dashboard"
              className="text-normal text-black hover:text-[#006239]/70 border-b-2 border-transparent hover:border-black duration-100"
            >
              Dashboard
            </Link>
          </div>
        </nav>
        <Toaster
          position="top-center"
          richColors={true}
          swipeDirections={["left", "right", "top"]}
        />
        <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

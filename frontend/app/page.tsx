import Link from "next/link";
import { outfit } from "@/fonts";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <main className="flex flex-col items-center gap-14 mt-10">
      {/* Hero */}
      <div className="text-center space-y-5">
        <h1
          className={cn(
            outfit.className,
            "text-6xl font-extrabold tracking-tight leading-tight",
          )}
        >
          Estimation{" "}
          <span className="bg-[#006239]/20 px-2 py-1 italic rounded">
            Calibrator
          </span>
        </h1>
        <p
          className={cn(
            outfit.className,
            "text-base text-gray-500 max-w-sm mx-auto leading-relaxed",
          )}
        >
          Log task estimates, track actuals, and spot the patterns that make
          your guesses drift.
        </p>
        <div className="flex gap-3 justify-center pt-1">
          <Link
            href="/log"
            className={cn(
              outfit.className,
              "bg-[#006239] text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-[#006239]/80 transition-colors duration-100",
            )}
          >
            Log a task
          </Link>
          <Link
            href="/dashboard"
            className={cn(
              outfit.className,
              "border border-gray-200 text-gray-700 px-5 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors duration-100",
            )}
          >
            View dashboard
          </Link>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        <FeatureCard
          step="01"
          title="Log estimates"
          description="Before you start, record how long you think the task will take."
        />
        <FeatureCard
          step="02"
          title="Track actuals"
          description="When done, log the real time and note what caused the gap."
        />
        <FeatureCard
          step="03"
          title="Spot patterns"
          description="See your multiplier by category and get AI-powered feedback."
        />
      </div>
    </main>
  );
}

function FeatureCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-2">
      <span
        className={cn(
          outfit.className,
          "text-xs font-semibold text-[#006239]/70 uppercase tracking-widest",
        )}
      >
        {step}
      </span>
      <h3 className={cn(outfit.className, "text-sm font-semibold text-gray-900")}>
        {title}
      </h3>
      <p className={cn(outfit.className, "text-sm text-gray-500 leading-relaxed")}>
        {description}
      </p>
    </div>
  );
}

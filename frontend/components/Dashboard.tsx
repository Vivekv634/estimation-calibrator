"use client";

import { useEffect, useState } from "react";
import { fetchStats, fetchInsights } from "@/api";
import type { Stats, InsightResult } from "@/types/task";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { cn } from "@/lib/utils";
import { outfit } from "@/fonts";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { CircleXIcon } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [insight, setInsight] = useState<InsightResult | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats().then((res) => {
      if (res.data) setStats(res.data);
      setLoadingStats(false);
    });
  }, []);

  async function handleFetchInsight() {
    setLoadingInsight(true);
    setInsightError(null);
    const res = await fetchInsights();
    if (res.error) setInsightError(res.error);
    else setInsight(res.data);
    setLoadingInsight(false);
  }

  if (loadingStats)
    return (
      <Label className={cn("text-sm text-gray-500", outfit.className)}>
        Loading stats…
      </Label>
    );

  const noData = !stats || stats.avg_multiplier === null;

  return (
    <div className="space-y-8">
      {noData ? (
        <Label className={cn("text-sm text-gray-500", outfit.className)}>
          Complete at least 5 tasks to see stats.
        </Label>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Avg multiplier"
              value={`${stats.avg_multiplier}×`}
              note="actual ÷ estimate"
            />
            {Object.keys(stats.by_category).length > 0 && (
              <>
                <StatCard
                  label="Worst category"
                  value={worstCategory(stats.by_category)}
                  note={`${stats.by_category[worstCategory(stats.by_category)]}× avg`}
                />
                <StatCard
                  label="Best category"
                  value={bestCategory(stats.by_category)}
                  note={`${stats.by_category[bestCategory(stats.by_category)]}× avg`}
                />
              </>
            )}
          </div>

          {/* 4-week trend */}
          {stats.trend.length > 0 && (
            <div>
              <h2
                className={cn(
                  "text-sm font-semibold text-gray-700 mb-3",
                  outfit.className,
                )}
              >
                4-week trend
              </h2>
              <div className="flex gap-3 flex-wrap">
                {stats.trend.map((w) => (
                  <Card
                    key={w.week_start}
                    className="border border-gray-200 rounded-lg px-4 py-3 text-center min-w-25"
                  >
                    <CardContent
                      className={cn(outfit.className, "flex flex-col gap-1")}
                    >
                      <span className="text-xs text-gray-400">
                        {w.week_start}
                      </span>
                      <span className="text-lg font-semibold text-gray-800">
                        {w.avg_multiplier !== null
                          ? `${w.avg_multiplier}×`
                          : "—"}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Label
                className={cn(outfit.className, "text-xs text-gray-400 mt-2")}
              >
                Needs ≥5 tasks/week to be meaningful.
              </Label>
            </div>
          )}
        </>
      )}

      {/* AI insight */}
      <div className="border-t border-gray-100 pt-6">
        <h2
          className={cn(
            "text-sm font-semibold text-gray-700 mb-1",
            outfit.className,
          )}
        >
          AI pattern insight
        </h2>
        <Label className={cn("text-xs text-gray-400 mb-3", outfit.className)}>
          Analyzes your completed tasks and surfaces patterns in your estimates.
        </Label>
        <Button
          onClick={handleFetchInsight}
          disabled={loadingInsight}
          className={cn(
            "bg-[#006239] cursor-pointer text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#006239]/80 disabled:opacity-50",
            outfit.className,
          )}
        >
          {loadingInsight ? "Analyzing…" : "Generate insight"}
        </Button>

        {insightError && (
          <Label
            className={cn(
              outfit.className,
              "border border-red-400 text-black mt-4 bg-red-400/30 py-2 px-3 text-md rounded-md font-normal",
            )}
          >
            <CircleXIcon className="h-5 w-5" />
            {insightError}
          </Label>
        )}

        {insight && (
          <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-lg Label-4 space-y-2 max-w-xl">
            {"ready" in insight && insight.ready === false ? (
              <Label
                className={cn(
                  "border border-blue-400 text-black bg-blue-400/30 py-2 px-3 text-md rounded-md font-normal",
                  outfit.className,
                )}
              >
                {insight.insight}
              </Label>
            ) : (
              <>
                <Label
                  className={cn(
                    "text-sm font-medium text-gray-800",
                    outfit.className,
                  )}
                >
                  {insight.summary}
                </Label>
                <Label
                  className={cn("text-sm text-gray-600", outfit.className)}
                >
                  {insight.multiplier_note}
                </Label>
                <Label
                  className={cn("text-sm text-gray-600", outfit.className)}
                >
                  {insight.insight}
                </Label>
                <div
                  className={cn(
                    "flex gap-4 text-xs text-gray-500 pt-1",
                    outfit.className,
                  )}
                >
                  <span>
                    Best: <strong>{insight.best_category}</strong>
                  </span>
                  <span>
                    Worst: <strong>{insight.worst_category}</strong>
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle
          className={cn(
            outfit.className,
            "text-xs uppercase tracking-widest text-gray-500 font-semibold",
          )}
        >
          {label}
        </CardTitle>
        <CardDescription hidden></CardDescription>
      </CardHeader>
      <CardContent className={cn(outfit.className, "flex flex-col gap-0.5")}>
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        <span className="text-xs text-gray-400">{note}</span>
      </CardContent>
    </Card>
  );
}

function worstCategory(byCategory: Record<string, number>): string {
  return Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0][0];
}

function bestCategory(byCategory: Record<string, number>): string {
  return Object.entries(byCategory).sort((a, b) => a[1] - b[1])[0][0];
}

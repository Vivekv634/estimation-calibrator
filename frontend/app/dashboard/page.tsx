import Dashboard from "@/components/Dashboard";
import { outfit } from "@/fonts";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className={cn(outfit.className, "text-xl font-semibold")}>
          Dashboard
        </h1>
        <p className={cn(outfit.className, "text-sm text-gray-500 mt-1")}>
          Your estimation patterns and performance over time.
        </p>
      </div>
      <Dashboard />
    </div>
  );
}

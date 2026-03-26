export type TaskStatus = "pending" | "started" | "done";

export type TaskCategory =
  | "frontend"
  | "backend"
  | "debugging"
  | "database"
  | "integration"
  | "writing"
  | "other";

export interface Task {
  id: number;
  title: string;
  category: TaskCategory;
  estimate_mins: number;
  actual_mins: number | null;
  status: TaskStatus;
  note: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface StatsWeek {
  week_start: string;
  avg_multiplier: number | null;
}

export interface Stats {
  avg_multiplier: number | null;
  by_category: Record<string, number>;
  trend: StatsWeek[];
}

export interface InsightResult {
  summary: string;
  worst_category: string;
  best_category: string;
  insight: string;
  multiplier_note: string;
  ready?: boolean;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

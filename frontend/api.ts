import type { Task, Stats, InsightResult, ApiResponse } from "@/types/task";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  return res.json();
}

export async function fetchTasks(status?: string): Promise<ApiResponse<Task[]>> {
  const qs = status ? `?status=${status}` : "";
  return request<Task[]>(`/tasks${qs}`);
}

export async function createTask(data: {
  title: string;
  category: string;
  estimate_mins: number;
}): Promise<ApiResponse<Task>> {
  return request<Task>("/tasks", { method: "POST", body: JSON.stringify(data) });
}

export async function startTask(id: number): Promise<ApiResponse<Task>> {
  return request<Task>(`/tasks/${id}/start`, { method: "PATCH" });
}

export async function completeTask(
  id: number,
  data: { actual_mins: number; note: string }
): Promise<ApiResponse<Task>> {
  return request<Task>(`/tasks/${id}/complete`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteTask(id: number): Promise<ApiResponse<{ deleted: number }>> {
  return request<{ deleted: number }>(`/tasks/${id}`, { method: "DELETE" });
}

export async function fetchStats(): Promise<ApiResponse<Stats>> {
  return request<Stats>("/stats");
}

export async function fetchInsights(): Promise<ApiResponse<InsightResult>> {
  return request<InsightResult>("/ai/insights", { method: "POST" });
}

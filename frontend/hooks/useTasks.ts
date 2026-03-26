"use client";

import { useState, useCallback } from "react";
import type { Task } from "@/types/task";
import * as api from "@/api";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.fetchTasks();
    if (res.error) setError(res.error);
    else setTasks(res.data ?? []);
    setLoading(false);
  }, []);

  const createTask = useCallback(
    async (data: { title: string; category: string; estimate_mins: number }) => {
      const res = await api.createTask(data);
      if (res.error) throw new Error(res.error as string);
      setTasks((prev) => [res.data!, ...prev]);
      return res.data!;
    },
    []
  );

  const startTask = useCallback(async (id: number) => {
    const res = await api.startTask(id);
    if (res.error) throw new Error(res.error as string);
    setTasks((prev) => prev.map((t) => (t.id === id ? res.data! : t)));
    return res.data!;
  }, []);

  const completeTask = useCallback(
    async (id: number, data: { actual_mins: number; note: string }) => {
      const res = await api.completeTask(id, data);
      if (res.error) throw new Error(res.error as string);
      setTasks((prev) => prev.map((t) => (t.id === id ? res.data! : t)));
      return res.data!;
    },
    []
  );

  const deleteTask = useCallback(async (id: number) => {
    const res = await api.deleteTask(id);
    if (res.error) throw new Error(res.error as string);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { tasks, loading, error, loadTasks, createTask, startTask, completeTask, deleteTask };
}

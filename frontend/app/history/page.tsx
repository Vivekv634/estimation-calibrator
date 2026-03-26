"use client";

import { useEffect } from "react";
import TaskTable from "@/components/TaskTable";
import { useTasks } from "@/hooks/useTasks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { outfit } from "@/fonts";

export default function HistoryPage() {
  const {
    tasks,
    loading,
    error,
    loadTasks,
    startTask,
    completeTask,
    deleteTask,
  } = useTasks();

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return (
    <div>
      <h1 className={cn(outfit.className, "text-xl font-semibold mb-6")}>
        Task history
      </h1>
      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && toast.error(error)}
      {!loading && (
        <TaskTable
          tasks={tasks}
          onStart={startTask}
          onComplete={completeTask}
          onDelete={deleteTask}
        />
      )}
    </div>
  );
}

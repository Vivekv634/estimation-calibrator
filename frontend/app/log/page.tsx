"use client";

import { useEffect } from "react";
import LogTaskForm from "@/components/LogTaskForm";
import { useTasks } from "@/hooks/useTasks";

export default function LogPage() {
  const { loadTasks, createTask } = useTasks();

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return (
    <div>
      <LogTaskForm onSubmit={createTask} />
    </div>
  );
}

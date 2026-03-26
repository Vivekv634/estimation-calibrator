"use client";

import { useState } from "react";
import type { Task } from "@/types/task";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { cn } from "@/lib/utils";
import { outfit } from "@/fonts";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import TaskCompleteForm from "./TaskCompleteForm";
import { CircleXIcon } from "lucide-react";
import { Label } from "./ui/label";

interface Props {
  tasks: Task[];
  onStart: (id: number) => Promise<Task>;
  onComplete: (
    id: number,
    data: { actual_mins: number; note: string },
  ) => Promise<Task>;
  onDelete: (id: number) => Promise<void>;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  started: "bg-blue-100 text-blue-800",
  done: "bg-green-100 text-green-800",
};

export default function TaskTable({
  tasks,
  onStart,
  onComplete,
  onDelete,
}: Props) {
  const [completingTask, setCompletingTask] = useState<Task | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleStart(id: number) {
    setActionError(null);
    try {
      await onStart(id);
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Error");
    }
  }

  async function handleDelete(id: number) {
    setActionError(null);
    try {
      await onDelete(id);
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Error");
    }
  }

  if (tasks.length === 0) {
    return (
      <p className={cn("text-sm text-gray-500", outfit.className)}>
        No tasks yet. Log one first.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {actionError && (
        <Label
          className={cn(
            outfit.className,
            "border border-red-400 text-black mt-4 bg-red-400/30 py-2 px-3 text-md rounded-md font-normal",
          )}
        >
          <CircleXIcon className="h-5 w-5" />
          {actionError}
        </Label>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <Table className="min-w-full w-full text-sm">
          <TableHeader className={cn(outfit.className)}>
            <TableRow>
              <TableHead className="px-4 py-3 font-medium">Title</TableHead>
              <TableHead className="px-4 py-3 font-medium">Category</TableHead>
              <TableHead className="px-4 py-3 font-medium">Est.</TableHead>
              <TableHead className="px-4 py-3 font-medium">Actual</TableHead>
              <TableHead className="px-4 py-3 font-medium">Status</TableHead>
              <TableHead className="px-4 py-3 font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody
            className={cn(
              outfit.className,
              "divide-y divide-gray-100 bg-white",
            )}
          >
            {tasks.map((task) => (
              <TableRow key={task.id} className="even:bg-accent">
                <TableCell className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">
                  {task.title}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500">
                  {task.category}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500">
                  {task.estimate_mins}m
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500">
                  {task.actual_mins ? `${task.actual_mins}m` : "—"}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Badge className={cn(STATUS_STYLES[task.status])}>
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex gap-2 items-center flex-wrap">
                    {task.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleStart(task.id)}
                          className="text-xs bg-blue-600 text-white  hover:bg-blue-700"
                        >
                          Start
                        </Button>
                        <Button
                          variant={"destructive"}
                          onClick={() => handleDelete(task.id)}
                          className="text-xs"
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                    {task.status === "started" && (
                      <Button
                        onClick={() => setCompletingTask(task)}
                        className="text-xs bg-green-600 text-white hover:bg-green-700"
                      >
                        Complete
                      </Button>
                    )}
                    {task.status === "done" && (
                      <Button
                        variant="destructive"
                        onClick={() => handleDelete(task.id)}
                        className="text-xs"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TaskCompleteForm
        open={completingTask !== null}
        onOpenChange={(open) => {
          if (!open) setCompletingTask(null);
        }}
        task={completingTask}
        onComplete={onComplete}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import type { Task, TaskCategory } from "@/types/task";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { cn } from "@/lib/utils";
import { outfit } from "@/fonts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

const CATEGORIES: TaskCategory[] = [
  "frontend",
  "backend",
  "debugging",
  "database",
  "integration",
  "writing",
  "other",
];

interface Props {
  onSubmit: (data: {
    title: string;
    category: string;
    estimate_mins: number;
  }) => Promise<Task>;
}

export default function LogTaskForm({ onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TaskCategory>("backend");
  const [estimate, setEstimate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const mins = parseInt(estimate, 10);
    if (!mins || mins < 1 || mins > 480) {
      setError("Estimate must be between 1 and 480 minutes.");
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit({ title, category, estimate_mins: mins });
      setTitle("");
      setEstimate("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className={cn(outfit.className)}>
        <CardTitle className="text-3xl font-semibold">Log a task</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Set your estimate <strong>before</strong> you start. It locks once you
          begin.
        </CardDescription>
      </CardHeader>
      <CardContent className={cn(outfit.className)}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && toast.error(error)}

          <div>
            <Label htmlFor="title" className="mb-1">
              Task title
            </Label>
            <Input
              type="text"
              id="title"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fix login redirect bug"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <Label htmlFor="category" className="mb-1">
              Category
            </Label>
            <Select
              value={category}
              onValueChange={(e) => setCategory(e as TaskCategory)}
            >
              <SelectTrigger className="w-full">
                <SelectValue id="category" placeholder="select" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="estimate" className="mb-1">
              Estimate (minutes)
            </Label>
            <Input
              id="estimate"
              type="number"
              required
              min={1}
              max={480}
              value={estimate}
              onChange={(e) => setEstimate(e.target.value)}
              placeholder="e.g. 45"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Label className="text-xs text-gray-500 mt-1">
              Max 480 min (8 hrs). Locked once you start.
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant={"outline"}
              disabled={title.length == 0 && estimate.length == 0}
              onClick={() => {
                setTitle("");
                setEstimate("");
              }}
              className="disabled:cursor-not-allowed cursor-pointer"
            >
              clear all
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className={cn(
                "bg-[#006239] cursor-pointer text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#006239]/80 disabled:opacity-50",
                outfit.className,
              )}
            >
              {submitting ? "Logging…" : "Log task"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

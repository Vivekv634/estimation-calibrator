"use client";

import { useEffect, useState } from "react";
import type { Task } from "@/types/task";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { outfit } from "@/fonts";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onComplete: (
    id: number,
    data: { actual_mins: number; note: string },
  ) => Promise<Task>;
}

export default function TaskCompleteForm({
  open,
  onOpenChange,
  task,
  onComplete,
}: Props) {
  const [actualMins, setActualMins] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset form state whenever the dialog opens
  useEffect(() => {
    if (open) {
      setActualMins("");
      setNote("");
      setError(null);
    }
  }, [open]);

  async function handleSubmit() {
    if (!task) return;
    setError(null);

    const mins = parseInt(actualMins, 10);
    if (!mins || mins < 1) {
      setError("Enter actual time in minutes (min 1).");
      return;
    }
    if (mins > 1440) {
      setError("Actual time cannot exceed 1440 minutes (24 hours).");
      return;
    }
    if (!note || note.trim().length < 5) {
      setError("Note must be at least 5 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await onComplete(task.id, { actual_mins: mins, note: note.trim() });
      onOpenChange(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to complete task.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(outfit.className)}>
        <DialogHeader>
          <DialogTitle>Complete Task</DialogTitle>
          <DialogDescription>
            {task ? (
              <>
                Log how long{" "}
                <span className="font-medium text-foreground">
                  &ldquo;{task.title}&rdquo;
                </span>{" "}
                actually took and what caused any difference from your estimate
                of{" "}
                <span className="font-medium text-foreground">
                  {task.estimate_mins}m
                </span>
                .
              </>
            ) : (
              "Log how long the task actually took and what caused the difference."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="actual-mins">Actual time (minutes)</Label>
            <Input
              id="actual-mins"
              type="number"
              min={1}
              max={1440}
              placeholder="e.g. 45"
              value={actualMins}
              onChange={(e) => setActualMins(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note">What caused the difference?</Label>
            <Input
              id="note"
              type="text"
              placeholder="Describe what affected your estimate (min 5 chars)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {submitting ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

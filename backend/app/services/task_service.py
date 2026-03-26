from collections import defaultdict
from datetime import datetime, timezone, timedelta
from typing import Any
from ..db import db
from ..models import Task


def create_task(data: dict[str, Any]) -> Task:
    task = Task(
        title=data["title"],
        category=data["category"],
        estimate_mins=data["estimate_mins"],
    )
    db.session.add(task)
    db.session.commit()
    return task


def list_tasks(status_filter: str | None = None) -> list[Task]:
    query = db.select(Task).order_by(Task.created_at.desc())
    if status_filter:
        query = query.where(Task.status == status_filter)
    return list(db.session.execute(query).scalars().all())


def get_task(task_id: int) -> Task | None:
    return db.session.get(Task, task_id)


def start_task(task: Task) -> Task:
    if task.status != "pending":
        raise ValueError(f"Cannot start a task with status '{task.status}'")
    task.status = "started"
    task.started_at = datetime.now(timezone.utc)
    db.session.commit()
    return task


def complete_task(task: Task, data: dict[str, Any]) -> Task:
    if task.status != "started":
        raise ValueError(f"Cannot complete a task with status '{task.status}'")
    task.status = "done"
    task.actual_mins = int(data["actual_mins"])
    task.note = str(data["note"])
    task.completed_at = datetime.now(timezone.utc)
    db.session.commit()
    return task


def delete_task(task: Task) -> None:
    if task.status not in ("pending", "done"):
        raise ValueError("Only pending or completed tasks can be deleted.")
    db.session.delete(task)
    db.session.commit()


def get_stats() -> dict[str, Any]:
    done_tasks: list[Task] = list(
        db.session.execute(
            db.select(Task).where(Task.status == "done").order_by(Task.completed_at.desc())
        )
        .scalars()
        .all()
    )

    if len(done_tasks) < 3:
        return {"avg_multiplier": None, "by_category": {}, "trend": []}

    # actual_mins is guaranteed non-null for done tasks (set during complete_task)
    multipliers: list[float] = [
        t.actual_mins / t.estimate_mins
        for t in done_tasks
        if t.actual_mins is not None and t.estimate_mins
    ]
    avg_multiplier: float = round(sum(multipliers) / len(multipliers), 2)
    by_category: dict[str, float] = _calc_by_category(done_tasks)
    trend: list[dict[str, Any]] = _calc_trend(done_tasks)

    return {"avg_multiplier": avg_multiplier, "by_category": by_category, "trend": trend}


def _calc_by_category(tasks: list[Task]) -> dict[str, float]:
    buckets: dict[str, list[float]] = defaultdict(list)
    for t in tasks:
        if t.actual_mins is not None and t.estimate_mins:
            buckets[t.category].append(t.actual_mins / t.estimate_mins)
    return {
        cat: round(sum(vals) / len(vals), 2)
        for cat, vals in buckets.items()
        if len(vals) >= 3
    }


def _calc_trend(tasks: list[Task]) -> list[dict[str, Any]]:
    now: datetime = datetime.now(timezone.utc)
    weeks: list[dict[str, Any]] = []
    for i in range(3, -1, -1):
        week_start: datetime = now - timedelta(weeks=i + 1)
        week_end: datetime = now - timedelta(weeks=i)
        week_tasks: list[Task] = [
            t for t in tasks
            if t.completed_at
            and week_start <= t.completed_at.replace(tzinfo=timezone.utc) < week_end
        ]
        avg: float | None = None
        if week_tasks:
            valid = [
                t.actual_mins / t.estimate_mins
                for t in week_tasks
                if t.actual_mins is not None and t.estimate_mins
            ]
            avg = round(sum(valid) / len(valid), 2) if valid else None
        weeks.append({"week_start": week_start.date().isoformat(), "avg_multiplier": avg})
    return weeks

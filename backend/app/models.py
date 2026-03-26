from datetime import datetime, timezone
from typing import Any
from .db import db

VALID_CATEGORIES: list[str] = [
    "frontend", "backend", "debugging", "database",
    "integration", "writing", "other",
]
VALID_STATUSES: list[str] = ["pending", "started", "done"]


class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.Text, nullable=False)
    category = db.Column(db.Text, nullable=False)
    estimate_mins = db.Column(db.Integer, nullable=False)
    actual_mins = db.Column(db.Integer, nullable=True)
    status = db.Column(db.Text, nullable=False, default="pending")
    note = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    started_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "category": self.category,
            "estimate_mins": self.estimate_mins,
            "actual_mins": self.actual_mins,
            "status": self.status,
            "note": self.note,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }

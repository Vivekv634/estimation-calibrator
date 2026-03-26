import json
import os
from typing import Any
from openai import OpenAI
from ..db import db
from ..models import Task

_PROMPT_TEMPLATE = """You are analyzing a developer's time estimation history.

Pre-computed stats (use these exact values — do not recalculate):
- avg_multiplier: {avg_multiplier}

Here are their last completed tasks (JSON):
{tasks_json}

Return a JSON object with exactly these keys:
- "summary": one sentence describing their overall estimation pattern
- "worst_category": the category they underestimate most
- "best_category": the category they estimate most accurately
- "insight": 2-3 sentences of specific, actionable advice based on the patterns you see
- "multiplier_note": one sentence interpreting the avg_multiplier of {avg_multiplier} in plain language

Return ONLY valid JSON. No preamble, no markdown, no explanation outside the JSON."""

MIN_TASKS: int = 5
NOT_READY: dict[str, str | bool] = {
    "insight": "Log at least 5 completed tasks for reliable insights.",
    "ready": False,
}


def get_insights() -> dict[str, Any]:
    tasks: list[Task] = _fetch_done_tasks()
    if len(tasks) < MIN_TASKS:
        return {"data": NOT_READY, "error": None}

    summaries: list[dict[str, Any]] = [_task_to_summary(t) for t in tasks]
    avg_multiplier: float = round(
        sum(s["multiplier"] for s in summaries) / len(summaries), 2
    )
    tasks_json: str = json.dumps(summaries, indent=2)
    prompt: str = _PROMPT_TEMPLATE.format(tasks_json=tasks_json, avg_multiplier=avg_multiplier)

    raw: str = _call_openrouter(prompt)
    parsed: dict[str, Any] = _parse_response(raw)
    return {"data": parsed, "error": None}


def _fetch_done_tasks() -> list[Task]:
    return list(
        db.session.execute(
            db.select(Task)
            .where(Task.status == "done")
            .order_by(Task.completed_at.desc())
            .limit(20)
        )
        .scalars()
        .all()
    )


def _task_to_summary(task: Task) -> dict[str, Any]:
    actual: int = task.actual_mins if task.actual_mins is not None else 0
    estimate: int = task.estimate_mins if task.estimate_mins else 1
    return {
        "category": task.category,
        "estimate_mins": estimate,
        "actual_mins": actual,
        "multiplier": round(actual / estimate, 2),
        "note": task.note or "",
    }


def _call_openrouter(prompt: str) -> str:
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.getenv("OPENROUTER_API_KEY"),
    )
    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=2000,
    )
    choice = response.choices[0]
    content: str | None = choice.message.content
    if content is None:
        refusal: str | None = getattr(choice.message, "refusal", None)
        raise ValueError(
            f"Model returned no content. "
            f"finish_reason={choice.finish_reason!r}, refusal={refusal!r}"
        )
    return content


def _parse_response(raw: str) -> dict[str, Any]:
    # Strip markdown code fences if the model wrapped the JSON
    text: str = raw.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]
        text = text.rsplit("```", 1)[0]
    try:
        result: Any = json.loads(text.strip())
        if not isinstance(result, dict):
            raise ValueError("Model response was valid JSON but not an object.")
        return result
    except json.JSONDecodeError as e:
        raise ValueError(f"Model returned invalid JSON: {e}") from e

# Claude.md — Estimation Calibrator

You are a code assistant building **Estimation Calibrator**, a focused micro-tool that helps developers
track their time estimates vs. actual time, identify personal bias patterns, and improve over time.

This file is the single source of truth. Follow every rule here. Do not deviate unless explicitly told to.

---

## Project Overview

**What it does:**
- User logs a task with a time estimate BEFORE starting
- User marks task as started (estimate locks at this point)
- User marks task as done and logs actual time + a short note
- Dashboard shows personal estimation multiplier, category breakdown, trend over time
- AI endpoint analyzes the last 20 completed tasks and returns pattern insights

**What it does NOT do:**
- No team features, no sharing, no auth (single-user local tool)
- No time tracking (stopwatch) — user manually enters actual time
- No sub-tasks, no projects, no labels beyond category

Keep scope exactly here. Do not add features not listed above.

---

## Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Backend  | Python 3.11+, Flask, SQLAlchemy ORM     |
| Database | SQLite for dev (Postgres-ready via ENV) |
| Schemas  | Marshmallow (validation + serialization)|
| Tests    | Pytest                                  |
| Frontend | React + Vite (plain JS, no TypeScript)  |
| AI       | Anthropic Claude API (claude-sonnet-4-20250514) |

---

## Folder Structure

```
estimation-calibrator/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Flask app factory
│   │   ├── db.py                # SQLAlchemy instance
│   │   ├── models.py            # Task model only
│   │   ├── schemas.py           # Marshmallow schemas
│   │   ├── services/
│   │   │   ├── task_service.py  # All business logic lives here
│   │   │   └── ai_service.py    # Claude API call lives here
│   │   └── routes/
│   │       ├── tasks.py         # CRUD routes
│   │       └── ai.py            # /api/ai/insights route
│   ├── tests/
│   │   ├── conftest.py
│   │   └── test_tasks.py
│   ├── claude.md                # This file
│   ├── .env.example
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LogTaskForm.jsx
│   │   │   ├── TaskTable.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── hooks/
│   │   │   └── useTasks.js
│   │   ├── api.js               # All fetch calls in one place
│   │   └── App.jsx
│   └── package.json
│
└── README.md
```

Do not create files outside this structure without a clear reason.

---

## Database Schema

One table only: `tasks`

```
id            INTEGER  PRIMARY KEY AUTOINCREMENT
title         TEXT     NOT NULL
category      TEXT     NOT NULL  -- one of: frontend, backend, debugging, database, integration, writing, other
estimate_mins INTEGER  NOT NULL  -- entered before starting, locked after start
actual_mins   INTEGER  NULLABLE  -- filled when done
status        TEXT     NOT NULL  DEFAULT 'pending'  -- pending | started | done
note          TEXT     NULLABLE  -- why did estimate differ? filled when marking done
created_at    DATETIME NOT NULL  DEFAULT now
started_at    DATETIME NULLABLE
completed_at  DATETIME NULLABLE
```

**Do not add columns without updating schema, migration, and tests.**

---

## Status State Machine

This is the most important correctness rule in the system.

```
pending ──► started ──► done
```

- `pending → started`: sets `started_at`, locks `estimate_mins`
- `started → done`: requires `actual_mins` and `note`, sets `completed_at`
- **Any other transition is invalid and must return HTTP 400**
- Never allow: `done → started`, `done → pending`, `started → pending`, `pending → done` (skipping started)

Enforce this in `task_service.py`, NOT in the route handler.
The route handler only parses input and calls the service.

---

## Validation Rules (enforce in Marshmallow schemas)

- `title`: required, string, 1–200 chars
- `category`: required, must be one of the 7 allowed values (use `validate.OneOf`)
- `estimate_mins`: required on create, integer, min=1, max=480 (8 hours)
- `actual_mins`: required only when transitioning to `done`, integer, min=1, max=1440 (24 hours)
- `note`: required when transitioning to `done`, string, 5–500 chars
- `estimate_mins` cannot be updated after status is `started` or `done` — reject with 400

All inputs pass through Marshmallow before touching the DB. No exceptions.

---

## API Routes

```
POST   /api/tasks                  Create task (status=pending)
GET    /api/tasks                  List all tasks (optional ?status= filter)
GET    /api/tasks/<id>             Get single task
PATCH  /api/tasks/<id>/start       Transition pending → started
PATCH  /api/tasks/<id>/complete    Transition started → done (body: actual_mins, note)
DELETE /api/tasks/<id>             Delete only if status=pending

GET    /api/stats                  Return: avg_multiplier, by_category breakdown, trend (last 30 days)
POST   /api/ai/insights            Send last 20 done tasks to Claude, return pattern insight
```

**Consistent response envelope — always:**
```json
{ "data": <payload or null>, "error": <string or null> }
```

Never return a bare object or bare error string. Always wrap.

---

## Business Logic Rules

- **Multiplier** = `actual_mins / estimate_mins` (only calculated for `done` tasks)
- **avg_multiplier** = mean of all multipliers across done tasks
- **by_category** = avg multiplier broken down per category (only categories with ≥3 done tasks)
- **Trend** = avg multiplier per week for the last 4 weeks (shows if calibration is improving)
- Stats endpoint returns empty/null gracefully if fewer than 3 done tasks exist — do not crash

---

## AI Insights Endpoint Rules

File: `backend/app/services/ai_service.py`

- Fetch the last 20 tasks where `status = done`, ordered by `completed_at DESC`
- If fewer than 5 done tasks exist, return: `{"data": {"insight": "Log at least 5 completed tasks for reliable insights.", "ready": false}, "error": null}`
- Build a structured prompt (see below) — do NOT freeform-prompt the model
- Call `claude-sonnet-4-20250514` with `max_tokens=400`
- Parse the response and return it as-is to the frontend — do not reformat or truncate

**Prompt template (use this exactly, only fill in the task data):**
```
You are analyzing a developer's time estimation history.

Here are their last completed tasks (JSON):
{tasks_json}

Return a JSON object with exactly these keys:
- "summary": one sentence describing their overall estimation pattern
- "worst_category": the category they underestimate most
- "best_category": the category they estimate most accurately
- "insight": 2-3 sentences of specific, actionable advice based on the patterns you see
- "multiplier_note": one sentence interpreting their average multiplier in plain language

Return ONLY valid JSON. No preamble, no markdown, no explanation outside the JSON.
```

- Validate that Claude's response is valid JSON before returning it. If parsing fails, return a 500 with a clear error message.
- Never expose the raw Claude API response or API key in any log or response.

---

## Frontend Rules

- All API calls go through `src/api.js` — no fetch() calls inside components
- No business logic in components — components only render and call handlers
- `useTasks.js` hook manages task state, loading, and error state
- Three views only: **Log** (form to create task), **History** (table), **Dashboard** (stats + AI insight)
- Use plain CSS or a minimal utility approach — do not install a component library
- Show a clear disabled state on the estimate field once task is started
- Dashboard must show: avg multiplier, best category, worst category, 4-week trend, AI insight button
- AI insight is fetched on button click, not on page load (it costs an API call)

---

## Testing Requirements

Write these tests in `tests/test_tasks.py`. All must pass before submission.

```python
test_create_task_success
test_create_task_missing_title_returns_400
test_create_task_invalid_category_returns_400
test_create_task_estimate_too_large_returns_400
test_start_task_success
test_start_task_locks_estimate          # PATCH estimate after start → 400
test_complete_task_success
test_complete_task_missing_note_returns_400
test_complete_task_missing_actual_mins_returns_400
test_invalid_transition_done_to_started_returns_400   # most important
test_invalid_transition_pending_to_done_returns_400   # skip started → 400
test_delete_pending_task_success
test_delete_started_task_returns_400    # cannot delete in-progress work
test_stats_returns_empty_gracefully     # no done tasks → no crash
```

Use an in-memory SQLite DB for tests via `conftest.py`. Each test gets a clean DB.

---

## Code Style Rules

- Functions must be under 25 lines. Extract helpers if longer.
- No business logic in route handlers. Routes only: parse → call service → return response.
- No raw SQL anywhere. Use SQLAlchemy ORM only.
- No bare `except:` clauses. Catch specific exceptions.
- No `print()` for debugging — use Flask's `app.logger`
- No hardcoded strings for status values or categories — define them as constants at the top of `models.py`
- Every new route must have at least one corresponding test

---

## Environment Variables

```
DATABASE_URL=sqlite:///dev.db        # default
ANTHROPIC_API_KEY=your_key_here
FLASK_ENV=development
```

- Read all config from environment — no hardcoded values in source
- Provide `.env.example` with all keys listed (no real values)

---

## What to Avoid

- Do not use Flask-RESTful or any heavy framework layer — plain Flask routes only
- Do not add authentication — out of scope
- Do not add real-time features, websockets, or background jobs
- Do not store the AI response in the DB — it's always generated fresh on demand
- Do not install libraries not listed in requirements.txt without a clear reason
- Do not generate migrations automatically — write them by hand or use `db.create_all()` for dev
- Do not add pagination unless there are more than 200 tasks — out of scope for now

---

## Known Tradeoffs (document these in README too)

- SQLite is fine for single-user local use; switching to Postgres requires only changing `DATABASE_URL`
- No auth is a known risk — acceptable for a local dev tool
- AI insights are non-deterministic — same data may return slightly different insight each time
- Multiplier trend requires at least 5 tasks per week to be meaningful — surfaced as a UI note
- Deleting tasks removes them from stats history — acceptable for now, worth noting

---

## Definition of Done

The project is complete when:
- [ ] All API routes work and return correct envelope responses
- [ ] State machine rejects all invalid transitions with 400
- [ ] All 14 tests pass
- [ ] Frontend shows all three views and calls the correct endpoints
- [ ] AI insights endpoint returns structured JSON or a graceful not-ready message
- [ ] `.env.example` exists
- [ ] README covers: what it does, how to run, how to test, tradeoffs
- [ ] This `claude.md` is committed to the repo root

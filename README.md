# Estimation Calibrator

A developer tool to log task estimates, track actuals, and surface patterns in estimation accuracy over time — with AI-generated insights via OpenRouter.

---

## Stack

| Layer      | Technology                                |
| ---------- | ----------------------------------------- |
| Backend    | Python 3.12 + Flask 3.1                   |
| Database   | SQLite via Flask-SQLAlchemy               |
| Frontend   | Next.js 16 (React 19) + TypeScript        |
| Styling    | Tailwind CSS v4 + Radix UI (shadcn)       |
| AI         | OpenRouter API — `openai/gpt-oss-120b`    |
| Validation | Marshmallow (backend) + inline (frontend) |

---

## Project Structure

```
estimation-calibrator/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # App factory, blueprint registration
│   │   ├── db.py                # SQLAlchemy instance
│   │   ├── models.py            # Task model + to_dict()
│   │   ├── schemas.py           # Marshmallow input schemas
│   │   ├── routes/
│   │   │   ├── tasks.py         # CRUD + start/complete endpoints
│   │   │   └── ai.py            # POST /api/ai/insights
│   │   └── services/
│   │       ├── task_service.py  # Business logic, stats computation
│   │       └── ai_service.py   # OpenRouter call + response parsing
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── app/                     # Next.js App Router pages
│   ├── components/              # React components
│   ├── hooks/useTasks.ts        # All task state in one hook
│   ├── types/task.ts            # Shared TypeScript types
│   └── api.ts                   # Typed fetch wrappers
└── CLAUDE.md / AGENTS.md        # AI agent constraints
```

---

## Setup

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # add your OPENROUTER_API_KEY
python run.py                 # runs on localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                   # runs on localhost:3000
```

The frontend proxies all `/api/*` requests to the Flask backend via `next.config.ts`.

---

## Key Technical Decisions

### 1. Service layer separates business logic from routes

Routes in `routes/tasks.py` and `routes/ai.py` only handle HTTP concerns (parsing, responding). All state transitions, validation rules, and computation live in `services/`. This means a route handler never directly touches the database — it calls a service function that enforces the rules and returns a typed result.

Consequence: adding a new transport (CLI, websocket) requires no changes to business logic.

### 2. Task lifecycle enforced as a state machine

Tasks move through exactly three states: `pending → started → done`. Each transition is guarded in `task_service.py`:

- `start_task` rejects anything not `pending`
- `complete_task` rejects anything not `started`
- `delete_task` only permits `pending` or `done` tasks

Invalid state transitions return a `ValueError` that the route converts to a 400 response. The frontend never needs to enforce these rules — the API is the single source of truth.

### 3. Marshmallow schemas at the API boundary

All inbound data is validated by a Marshmallow schema before reaching the service layer. Field types, ranges, and required flags are declared once in `schemas.py`. This prevents malformed data from ever entering the system and keeps service functions free of defensive checks on input shape.

### 4. AI insights use pre-computed values, not model arithmetic

The AI prompt includes the pre-computed `avg_multiplier` (calculated by Python from the task records) so the model only interprets — it doesn't recalculate. This eliminates floating-point drift in the model's reasoning chain that caused a discrepancy between the UI stat (1.46) and the AI's self-computed value (1.44).

### 5. SQLite for simplicity, not scale

SQLite requires zero infrastructure and fits the single-user, local-first nature of this tool. The `db.py` file exposes a single `db` instance; swapping to PostgreSQL requires changing only `DATABASE_URL` in `.env` and no application code.

### 6. Hook-based state — no global store

All task state lives in `useTasks.ts`. Pages import the hook directly; there is no Redux, Zustand, or Context Provider. This is appropriate for a single-user app where no two pages need to share live state simultaneously.

---

## API Endpoints

| Method   | Path                      | Description                                          |
| -------- | ------------------------- | ---------------------------------------------------- |
| `GET`    | `/api/tasks`              | List all tasks (optional `?status=` filter)          |
| `POST`   | `/api/tasks`              | Create a task                                        |
| `PATCH`  | `/api/tasks/:id/start`    | Start a task                                         |
| `PATCH`  | `/api/tasks/:id/complete` | Complete a task with `actual_mins` + `note`          |
| `DELETE` | `/api/tasks/:id`          | Delete a pending or done task                        |
| `GET`    | `/api/stats`              | Avg multiplier, by-category breakdown, 4-week trend  |
| `POST`   | `/api/ai/insights`        | Generate AI pattern insight (requires ≥5 done tasks) |

All responses follow `{ "data": T | null, "error": string | null }`.

---

## AI Usage

AI (Claude Code via Anthropic) was used throughout this project for:

- **Scaffolding** — initial project structure, Flask app factory, SQLAlchemy model, and Next.js page layout
- **Component implementation** — `TaskCompleteForm`, `Dashboard`, `TaskTable` dialog refactor
- **Bug diagnosis** — identifying wrong model ID (`claude-sonnet-4-20250514`), JSON parse failures from markdown fences, `finish_reason='length'` on reasoning models
- **Type audit** — adding `dict[str, Any]`, `list[Task]`, `str | None` annotations and fixing `Sequence` vs `list` mismatches across the backend
- **Prompt engineering** — designing the AI insight prompt and fixing the multiplier mismatch

All generated code was reviewed, tested manually, and corrected where needed. The AI guidance files (`CLAUDE.md`, `AGENTS.md`) constrain the agent to read Next.js documentation before writing frontend code, since the version in use has breaking changes from training data.

---

## Known Risks and Tradeoffs

| Area                                                     | Risk / Tradeoff                                                                                                                                                                                                                          |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SQLite**                                               | Not suitable for concurrent writes or multi-user deployment. Acceptable for a local single-user tool.                                                                                                                                    |
| **No authentication**                                    | Any client with network access can read and modify all tasks. Out of scope for this tool's purpose.                                                                                                                                      |
| **AI cost**                                              | The OpenRouter API call is synchronous and blocks the request. A slow model response degrades UX. A task queue (Celery, RQ) would fix this but adds infrastructure complexity not warranted here.                                        |
| **Reasoning model token budget**                         | `gpt-oss-120b` is a reasoning model that consumes tokens internally before producing output. `max_tokens=2000` was chosen to cover typical reasoning depth; extremely large task histories could still exhaust the budget.               |
| **Stats threshold**                                      | `get_stats()` requires ≥3 done tasks; `get_insights()` requires ≥5. The thresholds are hardcoded constants (`MIN_TASKS`). They are intentionally small for demo purposes but too low for statistically meaningful results in production. |
| **No automated frontend tests**                          | Backend behaviour is covered by `tests/test_tasks.py`. The React components have no tests. Adding Playwright or React Testing Library would close this gap.                                                                              |
| **`_calc_by_category` filters categories with <3 tasks** | Categories with fewer than 3 completions are excluded from the by-category breakdown to avoid misleading single-sample averages. This means early-stage data shows fewer categories than expected.                                       |

---

## Extension Approach

The architecture is designed so new capabilities don't require touching existing code:

- **New task fields** (e.g. priority, tags) — add a column to `Task`, add a field to the relevant Marshmallow schema, update `to_dict()`. No route or service changes needed.
- **New AI provider** — replace `_call_openrouter()` in `ai_service.py`. The prompt, parsing, and callers are unchanged.
- **Multi-user support** — add a `User` model, associate tasks via foreign key, add JWT auth middleware. The service layer already receives task objects so user scoping is a filter added at the query level only.
- **New stat metric** — add a function to `task_service.py` and include its output in the `get_stats()` return dict. The frontend `Stats` type and Dashboard component need a matching field added.

---

## AI Guidance Files

| File        | Purpose                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `CLAUDE.md` | References `AGENTS.md`; entry point for Claude Code                                                                                                                |
| `AGENTS.md` | Constrains the AI agent to read the Next.js docs before writing frontend code, since Next.js 16 has breaking changes from the version in the model's training data |

These files prevent the AI from confidently writing stale API patterns (e.g. old `getServerSideProps` conventions) in a codebase using the App Router and React Server Components.

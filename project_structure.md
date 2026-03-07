# RecuperaVentas - Base Project Structure (MVP)

This scaffold follows `docs/architecture_mvp.md` and `docs/mvp_backlog_v2.md` with a modular monolith approach.

## 1) Directory structure

```text
.
|-- .env.example
|-- .gitignore
|-- package.json
|-- project_structure.md
|-- tsconfig.json
|-- docs/
|-- src/
|   |-- index.ts
|   |-- server.ts
|   |-- api/
|   |   |-- routes/
|   |   |   |-- index.ts
|   |   |   |-- session.routes.ts
|   |   |   |-- conversation.routes.ts
|   |   |   `-- recovery.routes.ts
|   |   `-- controllers/
|   |       |-- session.controller.ts
|   |       |-- conversation.controller.ts
|   |       `-- recovery.controller.ts
|   |-- modules/
|   |   |-- whatsapp-session/
|   |   |   `-- whatsapp-session.manager.ts
|   |   |-- message-ingestion/
|   |   |   `-- message-ingestion.service.ts
|   |   |-- conversation/
|   |   |   `-- conversation.service.ts
|   |   `-- recovery/
|   |       `-- recovery.service.ts
|   |-- workers/
|   |   |-- idle-detector.worker.ts
|   |   `-- recovery.worker.ts
|   |-- db/
|   |   |-- schema/
|   |   |   `-- 001_init.sql
|   |   `-- migrations/
|   |       `-- README.md
|   |-- events/
|   |   |-- domain-events.ts
|   |   `-- event-bus.ts
|   |-- config/
|   |   |-- env.ts
|   |   |-- database.ts
|   |   `-- queue.ts
|   `-- utils/
|       `-- logger.ts
```

## 2) Initial database schema

Location:
- `src/db/schema/001_init.sql`

Included tables:
- `workspaces`
- `whatsapp_sessions`
- `contacts`
- `conversations`
- `messages`
- `templates`
- `recovery_attempts`
- `sale_outcomes`
- `domain_event_logs`

Notes:
- Uses UUID primary keys (`uuid-ossp` extension).
- Includes basic constraints and indexes for MVP flows.
- No advanced reporting tables.

## 3) Minimal environment configuration

Location:
- `.env.example`

Variables:
- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `REDIS_URL`
- `WHATSAPP_SESSION_DATA_PATH`
- `IDLE_THRESHOLD_HOURS`
- `RECOVERY_TEMPLATE_TEXT`
- `LOG_LEVEL`

## 4) Dependency list

Runtime dependencies:
- `express`
- `whatsapp-web.js`
- `bullmq`
- `ioredis`
- `pg`
- `dotenv`
- `zod`
- `pino`
- `pino-http`
- `uuid`

Dev dependencies:
- `typescript`
- `tsx`
- `@types/node`
- `@types/express`

## 5) Local run instructions

1. Install dependencies:
   - `npm install`
2. Create env file:
   - `copy .env.example .env` (Windows)
3. Start PostgreSQL and Redis locally.
4. Apply schema:
   - `psql "postgres://postgres:postgres@localhost:5432/recuperaventas" -f src/db/schema/001_init.sql`
5. Start API:
   - `npm run dev`
6. Start workers in separate terminals:
   - `npm run worker:idle`
   - `npm run worker:recovery`

## 6) Current status

- This is scaffold only.
- Business logic is intentionally not implemented yet.
- Routes/controllers/services return placeholders to keep MVP structure clean.

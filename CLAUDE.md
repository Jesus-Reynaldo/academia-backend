# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

`backend-notas` is a NestJS 12 REST API for academic management ("Sistema Académico"): students, teachers, courses, subjects, academic periods, enrollments and grades, with JWT login, three roles and dashboard aggregate endpoints. Stack: TypeScript (ESM), Prisma 7 with MySQL (via `@prisma/adapter-mariadb`), class-validator DTOs, Swagger, Vitest. This repo is API-only: the React dashboard/login UI lives in a separate frontend project that consumes it (spec for it: `doc/dashboard-requirements.md`; backend change log: `doc/backend-proposals.md`). Domain language (models, endpoints, error messages) is Spanish. `doc/requirements.md` is the full functional spec (entities, business rules, endpoints, validations, deletion policy, seed); consult it before changing domain behavior. Note it still mentions SQLite as the initial DB — the actual implementation is MySQL.

## Commands

```bash
npm run start:dev       # dev server, watch mode (port $PORT or 3000)
npm run build           # nest build -> dist/
npm run lint            # oxlint --type-aware src/ test/
npm run format          # prettier --write

npm run test            # unit specs (**/*.spec.ts, colocated in src/)
npm run test:e2e        # e2e specs (test/**/*.e2e-spec.ts) with .env.test loaded via dotenv-cli

npm run prisma:migrate  # prisma migrate dev
npm run prisma:generate # regenerate client after schema changes
npm run prisma:seed     # runs prisma/seed.ts via tsx
```

Single test: `npx vitest run src/inscripcion/inscripcion.service.spec.ts`. For e2e: `npx dotenv -e .env.test -- vitest run --config ./vitest.config.e2e.ts test/curso.e2e-spec.ts`.

API is served under `/api/v1`; Swagger UI at `/api/docs` (use *Authorize* with the login `accessToken`).

Required env (see `.env.example`): `DATABASE_URL`, `JWT_SECRET` (the app refuses to boot without it), optional `JWT_EXPIRES_IN_SECONDS`, `NOTA_APROBACION`, `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`. `.env` and `.env.test` are gitignored. `prisma:seed` wipes the DB and creates one account per role (admin, docente, estudiante) sharing one password: `SEED_ADMIN_PASSWORD`, or a random one printed once to the console when unset. No password literals belong in the repo (a secret scanner flags them); tests generate theirs via `randomPassword()` in `test/helpers/auth.ts`. `README.md` is the student-facing setup guide (MySQL install options, `.env`, migrate, seed, run).

Prisma 7 notes: `migrate dev` does not regenerate the client — run `npm run prisma:generate` after schema changes. `migrate reset` has no `--skip-seed`/`--skip-generate` anymore, and when run by an AI agent Prisma refuses unless the user explicitly consents via `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` — `test:e2e` triggers a reset, so ask the user first.

## Architecture

- **ESM + NodeNext**: `"type": "module"`; all relative imports must include the `.js` extension (`import { X } from './x.service.js'`).
- **Feature modules** in `src/` (`estudiante`, `docente`, `curso`, `materia`, `periodo-academico`, `inscripcion`, `calificacion`), each with controller / service / module / `dto/` (`create-*`, `update-*`, `*-query`). `PrismaModule` is `@Global`, so `PrismaService` is injectable anywhere. `PrismaService` extends `PrismaClient` and builds the MariaDB adapter from `DATABASE_URL`.
- **Prisma config** is `prisma7.config.ts` (datasource URL from `DATABASE_URL`, seed command). Schema in `prisma/schema.prisma`, tables mapped to snake_case plural names with `@@map`. Core relation chain: `Estudiante → Inscripcion (unique per estudiante+curso+periodo) → Calificacion`, with `Calificacion` also linked to `Materia` and optional `Docente`.
- **Shared helpers in `src/common/`** that services rely on:
  - `paginate()` — generic `findMany`+`count` returning `{ data, meta: { page, limit, total, totalPages } }` (default limit 20); list DTOs extend `dto/pagination-query.dto.ts`. Sorting is whitelisted per service via a `SORTABLE_FIELDS` set.
  - `removeOrDeactivate()` + `sendRemovalResponse()` — soft-delete policy: an entity with dependents is deactivated (200 with the entity), otherwise hard-deleted (204). Controllers inject `@Res()` for this. Inscripciones/other entities with grades instead throw 409 telling the client to PATCH the estado.
  - `groupBy()` — used for building the academic history (`GET /estudiantes/:id/historial-academico`).
- **Auth (`src/auth`, `src/usuario`)**: `JwtAuthGuard` and `RolesGuard` are global `APP_GUARD`s (registered in `AuthModule`), so every route needs a Bearer token unless marked `@Public()`; add `@Roles('ADMIN', ...)` to restrict by role. The guard re-reads the `Usuario` on each request, so deactivating a user revokes access immediately; the JWT payload is just `{ sub }`. Passwords use `node:crypto` scrypt (`password.util.ts`). `ThrottlerGuard` is also global (login capped at 10/min; skipped when `NODE_ENV=test`). A `Usuario` links to exactly one `Estudiante` (rol ESTUDIANTE) or `Docente` (rol DOCENTE); ADMIN has no link and the link/rol are immutable after creation.
- **Ownership rules** are enforced in controllers (not services, to keep service signatures simple): `assertEstudianteAccess`/`assertDocenteAccess` in `auth/access.util.ts`, and list endpoints overwrite the query filter for restricted roles (e.g. an ESTUDIANTE's `/inscripciones` and `/calificaciones` are forced to their own `estudianteId`; a DOCENTE's `/calificaciones` to their `docenteId`). Per-role matrix: `doc/dashboard-requirements.md` §3.2.
- **Dashboard (`src/dashboard`)**: read-only aggregate endpoints (summary, course occupancy, averages, grade distribution, at-risk students, per-student/teacher summaries). Averages by course/distribution/at-risk use `$queryRaw` with `Prisma.sql` parameters because Prisma `groupBy` cannot group across relations. Default period is the `ACTIVO` one.
- **List responses embed relations**: `calificaciones` (`CALIFICACION_INCLUDE`), `inscripciones`, and `cursos` (`inscritosActivos`, counted over the ACTIVE period) so the UI needs no extra lookups. `paginate()` does not carry `include` into its return type, hence the cast in `curso.service.ts`. `DELETE /calificaciones/:id` always returns 409 by design.
- **Business rules live in services** and throw Nest HTTP exceptions (404 not found, 400 invalid state, 409 conflict/duplicate/capacity). Enrollment creation runs in a `$transaction` and also maps Prisma `P2002` unique violations to 409.
- **Global setup is duplicated**: `src/main.ts` configures the prefix, `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`, implicit conversion), CORS (localhost only) and Swagger; `test/helpers/create-test-app.ts` re-applies prefix + pipe manually. Keep them in sync when changing global behavior.
- **Observability**: `@nestjs/observe` is wired in `app.module.ts` (`ObserveInstrument` passed to `NestFactory.create`) with placeholder `appKey`/`appSecret`.

## Testing

- Unit specs (`*.service.spec.ts`) are colocated with services; `vitest.config.ts` includes `**/*.spec.ts`.
- E2E tests run against a real MySQL database defined in `.env.test` (`DATABASE_URL`, plus `JWT_SECRET`). Authenticate with `test/helpers/auth.ts` (`createUsuario`, `agentFor`, `adminAgent`): `cleanDatabase()` wipes `usuarios`, so call `adminAgent()` *after* it in `beforeEach`. `test/global-setup.ts` runs `prisma migrate reset --force` against it before the suite, so never point `.env.test` at a database with data you care about. E2E files run serially (`fileParallelism: false`) and each calls `cleanDatabase()` (`test/helpers/clean-db.ts`) in `beforeEach` — update that helper (respecting FK delete order) when adding models.
- Lint is `oxlint` (not ESLint) with `typescript/no-floating-promises` as error.

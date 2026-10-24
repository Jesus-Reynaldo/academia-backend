# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

`backend-notas` is a NestJS (v12) TypeScript backend, currently a fresh starter scaffold (single `AppController`/`AppService` returning "Hello World!"). Everything here reflects the actual scaffold — there is no existing domain logic yet.

## Commands

```bash
npm run start:dev      # dev server with watch mode
npm run start:debug    # dev server with debugger + watch mode
npm run start:prod      # run compiled dist/main

npm run build           # nest build -> dist/
npm run lint             # oxlint --type-aware src/ test/
npm run format            # prettier --write "src/**/*.ts" "test/**/*.ts"

npm run test              # vitest run (unit specs: **/*.spec.ts, co-located in src/)
npm run test:watch        # vitest watch mode
npm run test:cov          # vitest run with coverage
npm run test:e2e          # vitest run --config ./vitest.config.e2e.ts (test/**/*.e2e-spec.ts)
```

To run a single test file: `npx vitest run src/app.controller.spec.ts` (or `npx vitest src/app.controller.spec.ts` to watch). Same pattern for e2e specs but add `--config ./vitest.config.e2e.ts`.

## Architecture notes

- **ESM + NodeNext**: `package.json` has `"type": "module"`, and `tsconfig.json` uses `module`/`moduleResolution: "nodenext"`. All relative imports within `src/` and `test/` must include the `.js` extension (e.g. `import { AppService } from './app.service.js'`), even though the source files are `.ts`.
- **Two separate Vitest configs**: `vitest.config.ts` runs unit specs (`**/*.spec.ts`, colocated next to source files in `src/`), `vitest.config.e2e.ts` runs `test/**/*.e2e-spec.ts`. Both load `vite-tsconfig-paths` to resolve any path aliases added later (e.g. via `nest g library`).
- **Observability**: `src/app.module.ts` sets up `@nestjs/observe` via `createObserveModule()`, exporting both `ObserveModule` (imported into `AppModule`) and `ObserveInstrument` (passed to `NestFactory.create` in `src/main.ts`). The `appKey`/`appSecret` in `ObserveModule.forRoot()` are placeholders — real tracing/metrics require an account at observe.nestjs.com.
- **Linting**: uses `oxlint` (not ESLint), configured in `.oxlintrc.json` with `--type-aware` checking. `typescript/no-floating-promises` is set to `error`; `typescript/no-explicit-any` is disabled.
- **Standard Nest structure going forward**: as domain modules are added, follow Nest conventions — one module per feature under `src/`, with controller/service/module files, and colocated `*.spec.ts` unit tests next to the code they test.

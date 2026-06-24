# AGENTS.md — Copilot Cowork Credits Estimator

Project-wide instructions for any agent/contributor working on this repo.

## 🔴 Mandatory rule for every Functional Point (FP) / feature

For **every** FP or feature you implement, the following are **always required** (definition of done):

1. **Documentation** — update the in-app Help page (`src/pages/Help`) **and**
   `docs/USER_GUIDE.md` (Italian **and** English).
2. **Guided tour** — add/extend the step-by-step guided tour for the new section, anchoring elements
   with `data-tour="<id>"`. The tour must be restartable by the user.
3. **i18n (IT + EN)** — every user-facing string (UI, hints, tour, in-app docs) must have keys in
   both `src/i18n/locales/it.json` and `en.json`. **No hardcoded user-facing strings.** Add
   translated `InfoHint` tooltips on important values/fields.

A feature is **not done** if any of these three is missing. See
[`docs/DEVELOPMENT_RULES.md`](docs/DEVELOPMENT_RULES.md) for the full checklist.

## Guided tour behavior

- Auto-starts once per browser (localStorage `copilot_cowork_tour_seen_v1`).
- Dismissing (skip/close/finish) persists the flag → it won't auto-start again.
- A manual "restart tour" control must always be available (global header + Help page).
- Restarting manually and dismissing again keeps it dismissed.

## Tech stack & conventions

- React 19 + TypeScript (strict), Vite, Tailwind CSS v4, shadcn/ui, Zustand, react-i18next.
- App version: single source of truth in `package.json`, injected at build time (`__APP_VERSION__`).
- Persistence: `localStorage` only via `storageService`. No backend, no login, no tracking.
- Keep calculation logic in `engine/`, system seed data in `lib/systemData.ts`.

## Verify before considering work complete

```bash
npm run type-check
npm run lint     # fast-refresh warnings on shadcn/ui files are acceptable
npm run build
```

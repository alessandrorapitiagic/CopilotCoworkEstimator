# Copilot Cowork Credits Estimator

A static, browser-only planning tool that estimates the consumption and cost of **Microsoft Copilot
Cowork Credits** for an organization. Built with **React 19 + TypeScript + Vite**, styled with
**Tailwind CSS v4** and **shadcn/ui**, fully bilingual (🇮🇹 / 🇬🇧) with light/dark themes.

> ⚠️ All results are **planning estimates** based on editable assumptions. They do **not** represent
> official Microsoft pricing.

## Features

- 📊 **Dashboard** with aggregated KPI (credits, cost, warnings) and min/mid/max range toggle
- 🏢 **Companies** and 🧪 **Scenarios** management with workforce segmentation
- 🔢 **Calculation engine** producing min/mid/max ranges per segment, model and intensity
- 📚 Versioned **Assumption Packs** (credit bands, model factors)
- 🌗 **Light / Dark / System** theme
- 🌍 **i18n** — Italian & English (react-i18next)
- 🧭 **Guided tour** on first run + restartable from Help
- 💡 **Contextual hints** (info tooltips) on KPI and form fields
- 💾 **Local-first**: data stored in `localStorage`, with JSON export/import
- 🚀 Deployable as a **static app on GitHub Pages**

## Documentation

- **User guide** (IT/EN): [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md)
- An in-app **Help** page is available at `#/help`, with a restartable guided tour.

## Getting started

```bash
# install dependencies
npm install

# start the dev server
npm run dev

# type-check
npm run type-check

# production build
npm run build

# preview the production build locally
npm run preview
```

## Versioning

The app version is the **single source of truth** in [`package.json`](package.json). It is injected
at build time via Vite `define` (`__APP_VERSION__`) and shown in the sidebar and the Help page.

To release a new version, bump the `version` field in `package.json`.

## Project structure

```
src/
├── components/
│   ├── layout/        # App shell (sidebar, mobile drawer)
│   ├── shared/        # Reusable bits (InfoHint, ...)
│   ├── tour/          # Guided tour provider + overlay
│   └── ui/            # shadcn/ui primitives
├── engine/            # calculationEngine
├── i18n/              # i18next config + it/en locales
├── lib/               # utils, systemData, appInfo
├── pages/             # Dashboard, Companies, Scenarios, Assumptions, Compare, Settings, Help
├── services/          # storageService
├── store/             # Zustand global store
└── types/             # domain types
```

## Deployment

A GitHub Actions workflow ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) builds the
app and deploys `dist/` to **GitHub Pages** on every push to `main`.

To enable it: **GitHub → Settings → Pages → Source: GitHub Actions**.

The Vite `base` is set to `/CopilotCoworkEstimator/` — update it in `vite.config.ts` if the repo name
changes.

## License

MIT

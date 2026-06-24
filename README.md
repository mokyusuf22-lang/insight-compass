# Be:More — Insight Compass

AI-powered career coaching platform.

## Getting started

Requires Node.js & npm.

```sh
git clone <YOUR_GIT_URL>
cd insight-compass
npm install
npm run dev
```

Copy `.env.example` to `.env` and fill in your Supabase project values before running locally.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase

## Deployment

Pushes to `main` trigger [.github/workflows/deploy.yml](.github/workflows/deploy.yml), which builds the app and publishes it to GitHub Pages via GitHub Actions.

To enable it on a repo:

1. In the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.
2. Push to `main`, or run the workflow manually from the **Actions** tab.

The workflow works whether Pages is served from a project subpath (`<user>.github.io/<repo>`) or a root/custom domain — the base path is detected automatically.

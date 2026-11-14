# Devya Marketing

Marketing and PR workspace for Devya Solutions (campaigns, content calendar,
press outreach) at `marketing.devya-solutions.com`. Next.js App Router; the
browser calls `/api/*`, which Next rewrites to the Devya backend
(`API_PROXY_TARGET`, default `https://api.devya-solutions.com`). Sign-in uses the
shared `devya_session` cookie set by the backend.

## Development

```bash
npm install
npm run dev        # portless: https://marketing.localhost:1355
```

## Hosting

The app left Vercel after the 2026-11-13 account pause. It now runs on the
Devya VPS (`72.61.81.59`) behind nginx. Nothing is built on the VPS:

- `bash scripts/deploy.sh` (from the Mac) exports `origin/main`, builds the Next
  standalone server locally (`output: 'standalone'`), swaps the macOS native
  addons (sharp) for their Linux x86-64 builds, ships the tree to
  `/home/devya/projects/devya-marketing-app/releases/<sha>` and points `current`
  at it.
- `docker-compose.prod.yml` runs that tree read-only on a stock
  `node:24.22.1-alpine` image (no build step): container `devya-marketing-app`
  on `127.0.0.1:3151`.
- Host: `marketing.devya-solutions.com` (nginx file
  `/etc/nginx/sites-available/devya-marketing-app`, TLS by certbot).
- Env vars: none (the Vercel project had none); the code defaults apply.
- Rollback: point `current` at an older release, then
  `docker compose -f docker-compose.prod.yml up -d --force-recreate`.
- Merge gate: `scripts/ci-local.sh` (install, lint, typecheck, build), run by
  Jenkins (`Jenkinsfile`) as `continuous-integration/jenkins/pr-head`.

# Grok Workspace Project

A cleaned, GitHub-ready version of the project source.

## What was removed

This public package excludes generated/local workspace metadata and embedded credentials, including:

- `.grok/`
- `.vercel/`
- `.tanstack/`
- `artifacts/`
- Generated preview metadata
- Hard-coded preview client secret

## Environment variables

Copy `.env.example` to `.env.local` and add your real development/deployment values.

**Never commit `.env`, `.env.local`, API keys, client secrets, database URLs, or access tokens.**

## Run locally

```bash
npm install
npm run dev
```

The application will start using the project's existing Vite/TanStack configuration.

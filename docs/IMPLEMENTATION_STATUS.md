# Media Engine foundation

The applied Supabase migration is tracked. Four tables, owner-based RLS and explicit grants are deployed. Security advisors returned zero findings; four unused-index notices on empty tables.

Dashboard uses Supabase Auth password endpoint and REST API with a publishable key and user token. Session is memory-only; refresh requires sign-in. Brand creation, status changes, content ideas and manual stages implemented. Budget is metadata only. Social accounts and jobs are schema only. No paid calls or automated publishing.

## Run locally

1. Copy dashboard/.env.example to dashboard/.env.local and obtain the publishable key from Supabase Connect. Never use a service-role or secret key.
2. In Supabase Authentication > Users create your own confirmed user; disable public signup for a private workspace.
3. cd dashboard; npm ci; npm run dev. Open http://localhost:3000.
4. Sign in, create a brand and content idea, change statuses, sign out/in to verify persistence.

## Verification

Database migration/advisors verified remotely. UI build, lint and browser tests not run. Run npm run lint, npx tsc --noEmit and npm run build locally. Installed framework docs referenced by generated AGENTS.md were not available remotely.

## Next

Session refresh/revocation, full brand editing, server-authorized job transitions, budget enforcement, n8n exports, provider adapters, approval enforcement and publishing. Do not activate paid calls or publishing without authorization.

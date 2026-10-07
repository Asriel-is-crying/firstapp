# CampusFlow

A universal Expo / React Native application focused on a responsive web beta. One codebase, Expo Router, TypeScript, Supabase PostgreSQL/Auth/Storage, TanStack Query, React Hook Form and Zod. No separate web app.

## Status

Implemented: public event discovery and shareable event/club links; authentication screens; registrations and waitlists; saves and follows; club and event administration; committee availability, roles, shifts, staffing gaps and conflict overrides; platform moderation; storage policies. Without backend configuration, the app runs an explicitly labeled **read-only browsing demo**.

**Not yet a launched beta:** a real Supabase project and signed-in Expo account are required. Hosted email delivery, auth redirects, concurrent registration, storage uploads and real student/organizer acceptance must be verified after setup. See [validation status](docs/validation.md).

## Run locally

Use Node 22.13+ (Node 24 tested) and pnpm 11.19.0.

```sh
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
pnpm web
```

Leave Supabase values empty for the browsing demo. For real data, fill in only the project URL and frontend-safe public anon/publishable key. Never use a service-role key in `EXPO_PUBLIC_*` variables.

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm preview
pnpm exec playwright install chromium
pnpm test:browser
```

`pnpm preview` serves the exported app on http://127.0.0.1:4173 with deep-link fallback. `PLAYWRIGHT_CHANNEL=msedge` can use an installed Edge browser. Browser tests exercise demo discovery, filters, direct links, login gates, error states and layout at 375, 430, 768, 1024 and 1440 pixels. Database tests execute migrations, real SQL constraints and RLS in PGlite with test-only Supabase auth/storage schemas; they do not claim to test hosted Auth or Storage services.

## Supabase setup

1. Create a Supabase Free project. Keep email confirmation enabled. Set the Auth site URL and redirect allowlist to your deployed origin, `/auth/callback` and `/auth/reset` (plus localhost during development).
2. Apply migrations with `pnpm dlx supabase login`, `pnpm dlx supabase link --project-ref YOUR_REF`, then `pnpm dlx supabase db push`. Authenticate interactively; never commit access tokens/database passwords.
3. Add a real university using the SQL editor, e.g. `insert into public.universities(name,timezone) values ('Your university','Asia/Kuala_Lumpur');`.
4. Put the project URL and public anon key into `.env`. Set `EXPO_PUBLIC_SITE_URL` to the public HTTPS origin. These variables are embedded at build time.
5. Sign up a real owner account. Platform administration is provisioned manually by a trusted database operator: `insert into public.platform_admins(user_id) values ('OWNER_AUTH_UUID');`. User-editable metadata never grants privileges.
6. Configure your own SMTP delivery and provider rate limits before inviting a cohort. Test sign-up, verification and reset links in the same browser because PKCE uses a local verifier.

For a local Supabase instance with Docker, run `pnpm dlx supabase start` and `pnpm dlx supabase db reset`. The seed provides one fictional university, eight clubs, twenty events, six demo users, registrations, memberships, availability, roles, shifts and assignments. **Never run `seed.sql` on production.** Demo accounts are `organizer`, `committee`, `student`, `volunteer`, `student2`, and `moderator` at `@campusflow.example`, with local-only password `CampusFlowDemo!2026`.

## Deploy with EAS Hosting

```sh
pnpm dlx eas-cli@latest login
pnpm dlx eas-cli@latest init
pnpm deploy:development
pnpm deploy:preview
pnpm deploy:production
```

Production deploy refuses missing public configuration or a non-HTTPS site URL. It does not replace the acceptance checklist. See [web deployment](docs/web-deployment.md) for Supabase redirects and release steps. EAS project ownership must be selected by the actual account holder. No AWS infrastructure is required.

## Project map

- `src/app/`: Expo Router screens.
- `src/components/`: reusable React Native UI and form controls.
- `src/domain/`: portable models, validation, discovery and scheduling logic.
- `src/lib/`: Supabase services, auth, uploads and query hooks.
- `src/platform/`: isolated browser/native links and sharing.
- `supabase/migrations/`: schema, transactional RPCs, RLS and storage policies.
- `tests/`: domain tests, database security tests and browser tests.

Review [product scope](docs/product-spec.md), [architecture](docs/architecture.md), [security](docs/security-checklist.md), [privacy](docs/privacy-data-map.md), [decisions](docs/decisions.md) and [mobile readiness](docs/mobile-readiness.md).

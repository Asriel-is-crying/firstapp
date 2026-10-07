# EAS web deployment

Expo’s single-page export is the sole web build. EAS Hosting supports `single`, `static` and `server` output; this app chooses `single` for dynamic student-created URLs without per-event rebuilds. See [EAS Hosting setup](https://docs.expo.dev/eas/hosting/get-started/).

1. Authenticate with `pnpm dlx eas-cli@latest login` and initialize/link the owner’s project with `pnpm dlx eas-cli@latest init`. Keep the resulting public EAS project ID in app configuration. Do not commit a token.
2. Apply Supabase migrations to the intended environment, provision a university, and configure email confirmation plus redirect URLs.
3. Configure `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` and `EXPO_PUBLIC_SITE_URL`. These are bundled into the JavaScript at export time. A hosting-only environment change does not update an existing browser bundle: rebuild it.
4. Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` and `pnpm test:browser`.
5. `pnpm deploy:development` creates an EAS deployment under the development alias. `pnpm deploy:preview` creates the preview alias. Use separate Supabase projects for testing and production where possible.
6. Update Auth site URL/redirects for the actual EAS hostname, including `/auth/callback` and `/auth/reset`. Do not use broad wildcard redirects in production.
7. Complete hosted acceptance in security-checklist.md, then run `pnpm deploy:production`. The production command rejects absent public configuration and HTTP-only site URLs.
8. Test a new event deep link in a clean mobile browser; authenticate and register. Test another account independently organizing a club/event/team.

The app is not deployed merely because export passes. Auth, Storage, email delivery, RLS and actual production hosting must be verified. The current machine initially had neither an Expo login nor Supabase public configuration.

On another static host, serve `dist/` and rewrite unknown non-asset paths to `index.html`. Retain HTTPS and appropriate cache/security headers. The local `pnpm preview` command provides this behavior for verification. No EC2 or always-on custom Node server is needed.

The manifest supports home-screen metadata. No service worker or offline account-data caching is included. Runtime event titles/descriptions improve browser navigation; crawlers that do not execute JavaScript receive generic metadata until a future server-rendered route layer is added.

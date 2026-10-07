# Validation status

The initial implementation was tested on Windows with Node 24 and Expo SDK 57. It has been pushed to `Asriel-is-crying/firstapp`.

## Local verification

- Production Expo web export: passed.
- TypeScript: passed with strict mode.
- ESLint: passed using Expo’s configuration and compatible ESLint 9.
- 35 domain/PostgreSQL/seed tests passed for lifecycle states, discovery, validation, RLS, club creation, event drafting/publishing/cancellation, registration/waitlisting/cancellation, private availability, cross-event assignment conflicts, moderation, storage ownership and privilege escalation.
- Seed SQL: executed twice with PostgreSQL’s actual pgcrypto extension. Verified one university, eight clubs, twenty events, six accounts, related committee/registration data, password hashes and idempotence.
- Browser tests: passed at 375, 430, 768, 1024 and 1440 px. Verified no document overflow, discovery, search, filters, event links after reload, club links, registration/follow login gates, auth form validation, unauthorized page gates, nonexistent links and clipboard fallback.
- Expo dev server started and served the app. Runtime inspection found and fixed Expo Router’s style-array incompatibility for `Link asChild` event cards.
- Inspected desktop and mobile screenshots. Event photo loading verified against the image provider. Initial screenshot capture was faster than network image loading, so screenshots are not a complete image-availability check.
- Locked dependency installation and `expo install --check`: passed.
- Initial GitHub Actions run on Linux/Chromium: all steps passed, including locked install, TypeScript, lint, tests, production build and responsive browser checks. [Run](https://github.com/Asriel-is-crying/firstapp/actions/runs/37574899772).

## Limits and remaining release work

No Supabase project URL/public key or signed-in Expo session was present. The running app is therefore a clearly labeled browsing demo. No real account, hosted registration, uploaded image or production EAS URL has been claimed as verified.

Required next: connect the owner’s Supabase and Expo accounts, apply migrations, configure university/support information and SMTP/redirects, test real multi-account student and organizer workflows, test races with separate DB clients, then deploy and verify the production URL. See security-checklist.md for the exact release gates.

Native Android/iOS builds and native auth deep-link handling have not been validated; see mobile-readiness.md. Crawler-visible event metadata remains a documented SPA limitation. Browser automation exercises public demo screens; organizer/committee behavior is currently verified at the SQL/domain layer and still needs hosted UI acceptance.

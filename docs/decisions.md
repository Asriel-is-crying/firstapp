# Decisions

- 2026-10-07: Initialize the empty `Asriel-is-crying/firstapp` repository as CampusFlow, as requested. Use the repository root for the single Expo app.
- Choose official Expo SDK 57 TypeScript template and SDK-resolved dependencies. No Next.js or second web codebase.
- Prefer explicit, transactional SQL RPCs for security-sensitive workflows. Browser-derived capacity or conflict checks are never authoritative.
- Treat adjacent availability intervals as continuous coverage and shift boundaries as half-open. Check conflicts across clubs without revealing unrelated shift details to organizers.
- Require a written organizer override for any candidate who is not fully available; retain the reason and actor.
- Do not allow editing shift times after creation in this version; replacing a shift reruns assignment checks. This avoids silently introducing conflicts.
- Slugs contain random stable suffixes and are not changed when a title/name changes. Public links remain stable.
- Use a read-only, conspicuously labeled demo when Supabase is absent. No simulated signup or successful fake registrations.
- Use single-page Expo export for arbitrary new event links. EAS supports this output. Per-event crawler metadata is deferred, with runtime titles/descriptions implemented.
- Pin ESLint 9 because the Expo 57 React lint plugin is incompatible with ESLint 10’s removed context methods. Revisit together with the next Expo/config upgrade.
- Run PostgreSQL policy tests in PGlite on hosts without Docker. This complements, rather than substitutes for, hosted Supabase acceptance testing.
- No production deployment without real public configuration, account access, privacy/support setup and end-to-end verification.

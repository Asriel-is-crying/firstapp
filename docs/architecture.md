# Architecture

Expo SDK 57 / React Native 0.86 / React 19, with Expo Router screens under `src/app`. React Native primitives and styles implement responsive screens. React Hook Form controls forms; Zod validates account and event inputs. Platform-specific date/time inputs, URLs and sharing are isolated in `.web.ts(x)` files. Domain modules contain no DOM APIs.

TanStack Query owns server state. Supabase owns sessions, PostgreSQL, image storage and RLS. The public client uses the project URL and anon/publishable key only. Browser sessions use Supabase’s browser storage; native sessions use AsyncStorage and AppState-driven refresh. PKCE is enabled. Auth changes clear cached private data. Mutations invalidate queries.

Public catalog reads currently fetch the accessible event and club catalog (Supabase’s default row cap is 1,000). Discovery is filtered client-side for the initial campus beta. Before expanding to multiple large campuses, move discovery to a paginated, indexed SQL RPC; do not silently assume an unbounded catalog.

Registration and assignment writes are RPC-only. `register_event` locks the event row, checks time/state/capacity and creates an idempotent registration or waitlist entry. Cancellation uses the same lock and promotes users in queue order. `assign_shift` locks the member with a transaction advisory lock, checks team membership, merges availability and detects overlaps across all events. Nonavailable assignments need an explicit recorded reason. Declined assignments cannot be directly reactivated by a member. Shift times cannot be changed through arbitrary updates; create a replacement shift and reassign after review.

Tables use UUIDs, foreign keys, uniqueness, time/count checks and indexes. Security-definer helpers use empty search paths and schema-qualified references. Grants are explicitly revoked then narrowed, including column-level protection for profile disable state and club verification. RLS limits private data independently of UI navigation. Storage has a separate ownership policy and 5 MB JPEG/PNG/WebP restrictions.

EAS Hosting uses Expo’s `single` output so newly published event slugs work without rebuilding a static route list. Metadata updates in the browser; social crawlers that do not run JavaScript will see generic shell metadata. Full server-rendered previews are a later improvement. App icons and a web manifest support home-screen saving without a service worker or private-data caching.

Validation uses Vitest for domain behavior and actual PostgreSQL execution through PGlite. Auth/storage schemas in these tests are minimal test doubles; hosted Supabase and concurrent independent database connections require separate acceptance checks. Playwright tests the exported browser app at required widths.

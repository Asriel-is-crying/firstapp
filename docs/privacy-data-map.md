# Privacy data map

| Data | Purpose | Who can read |
| --- | --- | --- |
| Auth email and password hash | Authentication and recovery | Supabase Auth; admin membership lookup RPC uses email without returning it |
| Display name, university, avatar | Student profile, organizer rosters | Student; relevant organizer; platform moderator |
| Clubs, public events and uploaded images | Public discovery and sharing | Public |
| Draft/disabled events | Organizer workflow/moderation | Authorized organizer, assigned team, moderator |
| Registrations and waitlist | Attendance and capacity | Student and relevant organizers |
| Saved events and follows | Personal discovery | Owner |
| Committee roster, availability, shifts | Event staffing | Member’s own data and relevant organizers |
| Conflict classification | Avoid overlaps | Relevant organizer; other event details not disclosed |
| Reports and moderation log | Abuse handling and audit | Platform moderators |
| Notification preferences | Future opt-in messaging | Owner; no mailer is currently active |

Images are stored in a public Supabase bucket. Profile rows are protected, but image URLs are public. Avoid personal documents or sensitive images. Demo photos use remote Unsplash URLs, which cause a browser request to that image provider; production organizer uploads use Supabase.

The owner must publish a support address, retention schedule and deletion process before recruiting real students. Use trusted administrative procedures for account data exports/deletion, accounting for membership ownership, moderation audit references and shared event records. No advertising, behavioral tracking or AI inference is implemented.

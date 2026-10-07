# Product specification

CampusFlow helps students discover university events and clubs, and gives organizers a shared committee scheduling workspace. The first release target is mobile web, built from the universal Expo application.

Public users browse events and clubs without logging in. Search matches event titles, descriptions and club names. Filters cover today, tomorrow, the next seven days, category, price, university, club and registration availability. Sorting covers soonest, newest and registration count. Event pages show lifecycle/registration states, organizers, venue, time, price, capacity and contact details.

Students authenticate with verified Supabase email accounts, select a university, register or join a waitlist, cancel, save events and follow clubs. My Events separates upcoming, past and saved events. Cancellations promote eligible waitlisted users while registration remains open. A paid event displays its price but CampusFlow processes no payment.

Club creation atomically creates the owner’s admin membership. Organizers edit their club, upload branding, add existing registered students by email, draft/publish/edit/cancel events and inspect registrations. Each event has its own team roster and roles. Members submit one or more availability windows. Organizers create shifts and inspect assigned, confirmed and missing headcounts. Assignment candidates are Available, Partially Available, Unavailable or Already Assigned Elsewhere. Availability is merged across adjacent windows; intervals use half-open overlap semantics. Nonavailable/conflicting assignments require an explicit reason of at least ten characters. Members can confirm or decline; declined assignments require organizer reassignment.

Platform admins verify clubs, review reports, disable events/accounts and resolve reports. Moderation actions are audited. A moderator role is provisioned only by a trusted database operator.

Out of scope: payments, chat, AI recommendations/scheduling, jobs, social feeds, video hosting, blockchain and gamification. Email notifications, offline mutation queues, push notifications and native store releases are not enabled in this beta.

Release acceptance: a real student follows a public event link on their phone, verifies their account and registers successfully. A real organizer independently creates a club and event, receives registrations, adds a committee, collects availability, creates shifts and assigns people while seeing gaps/conflicts. All release checks in security-checklist.md must pass before calling the web beta ready.

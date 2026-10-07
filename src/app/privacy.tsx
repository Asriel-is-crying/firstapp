import { Text } from "react-native";
import { Page, s, Txt } from "../components/ui";
export default function Privacy() {
  return (
    <Page title="Privacy & support">
      <Text style={s.title}>Your campus data.</Text>
      <Txt>
        CampusFlow stores your account email, display name, university,
        registrations, saved events, club follows, and committee schedule.
        Public club and event pages can be read without an account.
      </Txt>
      <Txt>
        Your availability is visible only to you and the administrators
        organizing the relevant event. Organizers can see registrations for
        their events. Platform moderators review reports and may disable
        inappropriate content or accounts.
      </Txt>
      <Txt>
        Uploaded profile, club, and event images are publicly accessible. Do not
        upload private documents or sensitive information. Notification
        preferences do not currently send email reminders.
      </Txt>
      <Txt>
        Use the report button on event pages to flag concerns. For event
        questions, contact the organizer listed on the event. This beta uses
        Supabase for authentication, database storage and images.
      </Txt>
      <Txt>
        The project owner must publish their support contact and retention
        policy before inviting real students. Browsing demo content is fictional
        and does not accept real registrations.
      </Txt>
    </Page>
  );
}

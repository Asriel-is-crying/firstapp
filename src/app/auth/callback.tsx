import { Text } from "react-native";
import { Page, s, Txt, NavLink } from "../../components/ui";
import { useAuth } from "../../lib/auth";
export default function Callback() {
  const { session } = useAuth();
  return (
    <Page title="Email verification">
      <Text style={s.h2}>
        {session ? "You’re signed in." : "Check your verification link"}
      </Text>
      <Txt>
        {session
          ? "Your account is ready. Choose your university in your profile."
          : "If this link has expired, request another email from the sign-up screen. Open verification links in the same browser used to sign up."}
      </Txt>
      <NavLink
        href={session ? "/profile" : "/auth/login"}
        label={session ? "Go to profile" : "Return to login"}
      />
    </Page>
  );
}

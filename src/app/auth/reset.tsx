import { Text, View } from "react-native";
import { Page, RequireAuth, s } from "../../components/ui";
import { Form } from "../../components/form";
import { backend } from "../../lib/supabase";
import { password } from "../../domain/validation";
export default function Reset() {
  return (
    <Page title="Reset password">
      <RequireAuth>
        <View style={s.card}>
          <Text style={s.h2}>Choose a new password</Text>
          <Form
            submit="Update password"
            fields={[
              { name: "password", label: "New password", secure: true },
              { name: "confirm", label: "Confirm password", secure: true },
            ]}
            onSubmit={async (v) => {
              password.parse(v.password);
              if (v.password !== v.confirm)
                throw new Error("Passwords do not match");
              const { error } = await backend().auth.updateUser({
                password: v.password,
              });
              if (error) throw error;
              return "Password updated. You can now return to your profile.";
            }}
          />
        </View>
      </RequireAuth>
    </Page>
  );
}

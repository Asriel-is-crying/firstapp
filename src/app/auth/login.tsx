import { useState } from "react";
import { Text, View } from "react-native";
import { Href, router, useLocalSearchParams } from "expo-router";
import { Page, Choice, choices, s } from "../../components/ui";
import { Form } from "../../components/form";
import { backend } from "../../lib/supabase";
import { email, password } from "../../domain/validation";
import { safeReturn } from "../../domain/logic";
import { authUrl } from "../../platform/links";
export default function Login() {
  const [mode, setMode] = useState("Log in"),
    params = useLocalSearchParams<{ next: string }>();
  return (
    <Page title={mode}>
      <View
        style={[s.card, { width: "100%", maxWidth: 520, alignSelf: "center" }]}
      >
        <Text style={s.title}>
          {mode === "Sign up"
            ? "Your campus starts here."
            : mode === "Forgot password"
              ? "Let’s get you back in."
              : "Welcome back."}
        </Text>
        <Choice
          label="Account"
          value={mode}
          options={choices(["Log in", "Sign up", "Forgot password"])}
          onChange={setMode}
        />
        <Form
          key={mode}
          submit={mode}
          fields={[
            ...(mode === "Sign up"
              ? [{ name: "name", label: "Your name" }]
              : []),
            { name: "email", label: "Email address" },
            ...(mode !== "Forgot password"
              ? [{ name: "password", label: "Password", secure: true }]
              : []),
          ]}
          onSubmit={async (v) => {
            const address = email.parse(v.email.trim());
            const auth = backend().auth;
            if (mode === "Forgot password") {
              const { error } = await auth.resetPasswordForEmail(address, {
                redirectTo: authUrl("auth/reset"),
              });
              if (error) throw error;
              return "If an account exists, a reset link will arrive by email.";
            }
            if (mode === "Sign up") {
              password.parse(v.password);
              if (v.name.trim().length < 2) throw new Error("Enter your name");
              const { error } = await auth.signUp({
                email: address,
                password: v.password,
                options: {
                  data: { display_name: v.name.trim() },
                  emailRedirectTo: authUrl("auth/callback"),
                },
              });
              if (error) throw error;
              return "Check your email to verify your account, then log in.";
            }
            const { error } = await auth.signInWithPassword({
              email: address,
              password: v.password,
            });
            if (error) throw error;
            router.replace(safeReturn(params.next) as Href);
          }}
        />
      </View>
    </Page>
  );
}

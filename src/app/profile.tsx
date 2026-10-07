import { Text, View, Image } from "react-native";
import { router } from "expo-router";
import {
  Page,
  RequireAuth,
  s,
  Choice,
  Button,
  NavLink,
  Notice,
  Loading,
} from "../components/ui";
import { Form } from "../components/form";
import { useAuth } from "../lib/auth";
import { useAction, useCatalog } from "../lib/hooks";
import { update } from "../lib/api";
import { backend } from "../lib/supabase";
import { uploadImage } from "../lib/images";
import { useQueryClient } from "@tanstack/react-query";
export default function ProfilePage() {
  return (
    <Page title="Profile">
      <RequireAuth>
        <Content />
      </RequireAuth>
    </Page>
  );
}
function Content() {
  const qc = useQueryClient();
  const auth = useAuth(),
    q = useCatalog(),
    action = useAction(
      async ({ kind, value }: { kind: string; value?: string }) => {
        if (!auth.session) return;
        if (kind === "university")
          await update("profiles", auth.session.user.id, {
            university_id: value,
          });
        if (kind === "image") {
          const url = await uploadImage("profiles", auth.session.user.id);
          if (url)
            await update("profiles", auth.session.user.id, { avatar_url: url });
        }
        if (kind === "logout") {
          const { error } = await backend().auth.signOut();
          if (error) throw error;
          router.replace("/");
        }
      },
    );
  if (!auth.profile) return <Loading />;
  return (
    <>
      <Text style={s.title}>Hello, {auth.profile.display_name}.</Text>
      <View style={s.card}>
        {auth.profile.avatar_url ? (
          <Image
            source={{ uri: auth.profile.avatar_url }}
            style={{ width: 80, height: 80, borderRadius: 40 }}
          />
        ) : null}
        <Button
          label="Upload profile photo"
          secondary
          onPress={() => action.mutate({ kind: "image" })}
        />
        <Form
          fields={[
            {
              name: "name",
              label: "Display name",
              initial: auth.profile.display_name,
            },
          ]}
          submit="Save profile"
          onSubmit={async (v) => {
            if (v.name.trim().length < 2 || v.name.length > 100)
              throw new Error("Use a name between 2 and 100 characters");
            await update("profiles", auth.session!.user.id, {
              display_name: v.name.trim(),
            });
            await qc.invalidateQueries({ queryKey: ["profile"] });
            return "Profile saved.";
          }}
        />
        <Choice
          label="Your university"
          value={auth.profile.university_id ?? ""}
          options={
            q.data?.universities.map((u) => ({ label: u.name, value: u.id })) ??
            []
          }
          onChange={(value) => action.mutate({ kind: "university", value })}
        />
        <Notice error={action.error} />
      </View>
      <NavLink href="/schedule" label="My committee schedule →" />
      <NavLink href="/manage/new-club" label="Create a campus club →" />
      <Button
        label="Log out"
        secondary
        disabled={action.isPending}
        onPress={() => action.mutate({ kind: "logout" })}
      />
    </>
  );
}

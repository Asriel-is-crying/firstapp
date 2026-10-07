import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  Page,
  RequireAuth,
  Empty,
  Loading,
  Notice,
  Button,
  s,
  Txt,
} from "../../../components/ui";
import { Form } from "../../../components/form";
import { useAuth } from "../../../lib/auth";
import { useAction, useCatalog, useRows } from "../../../lib/hooks";
import { Membership, Profile } from "../../../domain/models";
import { rpc, update } from "../../../lib/api";
import { uploadImage } from "../../../lib/images";
import { email } from "../../../domain/validation";
export default function ManageClub() {
  return (
    <Page title="Club profile & committee">
      <RequireAuth>
        <Content />
      </RequireAuth>
    </Page>
  );
}
function Content() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    q = useCatalog(),
    auth = useAuth(),
    members = useRows<Membership>("club_memberships", { club_id: id }),
    profiles = useRows<Profile>("profiles");
  const club = q.data?.clubs.find((c) => c.id === id);
  const action = useAction(async (field) => {
    const url = await uploadImage("clubs", id);
    if (url) await update("clubs", id, { [field as string]: url });
  });
  if (q.isPending) return <Loading />;
  if (
    !club ||
    !auth.memberships.some((m) => m.club_id === id && m.role === "admin")
  )
    return (
      <Empty
        title="Organizer access required"
        body="You must be a club administrator to manage this club."
      />
    );
  return (
    <>
      <Text style={s.title}>{club.name}</Text>
      <Form
        submit="Save club profile"
        fields={[
          { name: "name", label: "Club name", initial: club.name },
          {
            name: "description",
            label: "Description",
            initial: club.description,
            multiline: true,
          },
          {
            name: "email",
            label: "Contact email",
            initial: club.contact_email,
          },
        ]}
        onSubmit={async (v) => {
          email.parse(v.email);
          await update("clubs", id, {
            name: v.name,
            description: v.description,
            contact_email: v.email,
          });
          await q.refetch();
        }}
      />
      <View style={s.row}>
        <Button
          label="Upload logo"
          secondary
          onPress={() => action.mutate("logo_url")}
        />
        <Button
          label="Upload banner"
          secondary
          onPress={() => action.mutate("banner_url")}
        />
      </View>
      <Notice error={action.error ?? members.error ?? profiles.error} />
      <Text style={s.h2}>Committee</Text>
      {members.data?.map((m) => (
        <View key={m.id} style={s.card}>
          <Txt>
            {profiles.data?.find((p) => p.id === m.user_id)?.display_name ??
              m.user_id}{" "}
            · {m.role}
          </Txt>
        </View>
      ))}
      <Form
        submit="Add committee member"
        fields={[{ name: "email", label: "Member’s account email" }]}
        onSubmit={async (v) => {
          email.parse(v.email);
          await rpc("add_member", {
            p_club: id,
            p_email: v.email,
            p_role: "committee",
          });
          await members.refetch();
          return "Committee member added. Assign them to an event team next.";
        }}
      />
    </>
  );
}

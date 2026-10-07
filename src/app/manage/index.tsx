import { Text, View } from "react-native";
import {
  Page,
  RequireAuth,
  s,
  NavLink,
  Empty,
  Notice,
} from "../../components/ui";
import { useAuth } from "../../lib/auth";
import { useCatalog } from "../../lib/hooks";
export default function Manage() {
  const auth = useAuth(),
    q = useCatalog();
  const clubs =
    q.data?.clubs.filter((c) =>
      auth.memberships.some((m) => m.club_id === c.id && m.role === "admin"),
    ) ?? [];
  return (
    <Page title="Manage clubs">
      <RequireAuth>
        <Text style={s.title}>Your clubs, in good hands.</Text>
        <Notice error={q.error} />
        {clubs.map((c) => (
          <View key={c.id} style={s.card}>
            <Text style={s.h2}>{c.name}</Text>
            <NavLink
              href={"/manage/clubs/" + c.id}
              label="Club profile & committee →"
            />
            <NavLink
              href={"/manage/events/new?club=" + c.id}
              label="Create an event →"
            />
            {q.data?.events
              .filter((e) => e.club_id === c.id)
              .map((e) => (
                <View key={e.id} style={s.between}>
                  <Text style={s.text}>
                    {e.title} · {e.status}
                  </Text>
                  <View style={s.row}>
                    <NavLink
                      href={"/manage/events/" + e.id}
                      label="Edit & registrations"
                    />
                    <NavLink
                      href={"/manage/team/" + e.id}
                      label="Team & shifts"
                    />
                  </View>
                </View>
              ))}
          </View>
        ))}
        {!clubs.length ? (
          <Empty
            title="No clubs to manage yet"
            body="Create your club to publish events and organize a committee."
          />
        ) : null}
        <NavLink href="/manage/new-club" label="Create a club →" />
      </RequireAuth>
    </Page>
  );
}

import { Text, View } from "react-native";
import { Page, s, Txt, NavLink, Notice, Loading } from "../../components/ui";
import { useCatalog } from "../../lib/hooks";
export default function Clubs() {
  const q = useCatalog();
  return (
    <Page title="Campus clubs">
      <Text style={s.label}>FIND YOUR PEOPLE</Text>
      <Text style={s.title}>There’s a club for that.</Text>
      <Txt muted>Big interests. Small beginnings. A place to belong.</Txt>
      <Notice error={q.error} />
      {q.isPending ? (
        <Loading />
      ) : (
        q.data?.clubs.map((c) => (
          <View key={c.id} style={s.card}>
            <Text style={s.h2}>
              {c.name} {c.verified ? "✓" : ""}
            </Text>
            <Txt muted>{c.description}</Txt>
            <NavLink href={"/clubs/" + c.slug} label="Meet the club →" />
          </View>
        ))
      )}
    </Page>
  );
}

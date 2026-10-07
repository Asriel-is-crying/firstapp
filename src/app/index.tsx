import { Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import {
  Button,
  Choice,
  choices,
  Empty,
  EventGrid,
  Loading,
  NavLink,
  Notice,
  Page,
  s,
  Txt,
  colors,
} from "../components/ui";
import { useCatalog, useRows } from "../lib/hooks";
import { useAuth } from "../lib/auth";
import { Follow, categories } from "../domain/models";
export default function Home() {
  const q = useCatalog(),
    auth = useAuth(),
    f = useRows<Follow>("club_followers"),
    { width } = useWindowDimensions();
  const data = q.data;
  const upcoming =
    data?.events
      .filter(
        (e) => e.status === "published" && new Date(e.ends_at) > new Date(),
      )
      .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at)) ?? [];
  const followed = upcoming.filter((e) =>
    f.data?.some((x) => x.club_id === e.club_id),
  );
  return (
    <Page>
      <View style={[s.hero, { padding: width < 600 ? 24 : 38 }]}>
        <View style={s.between}>
          <Text style={[s.label, { color: colors.lime }]}>
            A LITTLE LESS SCROLLING. A LOT MORE LIVING.
          </Text>
          <Text style={{ color: "#ACBFB3", fontSize: 13 }}>
            Your campus, connected ↗
          </Text>
        </View>
        <Text
          style={{
            fontSize: width < 600 ? 38 : 58,
            lineHeight: width < 600 ? 43 : 64,
            fontWeight: "700",
            letterSpacing: -2,
            color: colors.white,
            maxWidth: 760,
          }}
        >
          Good things happen{"\n"}when you show up.
        </Text>
        <Text
          style={{
            fontSize: 17,
            lineHeight: 26,
            color: "#D2E1D5",
            maxWidth: 550,
          }}
        >
          Find your next event, meet your kind of people, and make campus feel a
          little more like you.
        </Text>
        <View style={s.row}>
          <Button
            label="Find your next thing →"
            onPress={() => router.push("/explore")}
          />
          <Button
            label="Meet the clubs"
            secondary
            onPress={() => router.push("/clubs")}
          />
        </View>
      </View>
      <View style={s.between}>
        <View style={{ gap: 5 }}>
          <Text style={s.label}>OFF THE GROUP CHAT. ON YOUR CALENDAR.</Text>
          <Text style={s.h2}>Happening soon</Text>
        </View>
        <NavLink href="/explore" label="Explore all events →" />
      </View>
      {q.isPending ? <Loading /> : <Notice error={q.error} />}
      {data && <EventGrid events={upcoming.slice(0, 6)} clubs={data.clubs} />}
      {!q.isPending && !upcoming.length && !q.error ? (
        <Empty
          title="Your campus is getting started"
          body="Club organizers can publish the first event from their profile."
        />
      ) : null}
      <View style={[s.card, { backgroundColor: "#EAF0E0" }]}>
        <Text style={s.h2}>What are you into?</Text>
        <Choice
          label="Find your corner of campus"
          value=""
          options={choices(categories)}
          onChange={(category) =>
            router.push({ pathname: "/explore", params: { category } })
          }
        />
      </View>
      {auth.session && followed.length > 0 && data ? (
        <>
          <Text style={s.h2}>From clubs you follow</Text>
          <EventGrid events={followed.slice(0, 3)} clubs={data.clubs} />
        </>
      ) : null}
      {data && upcoming.length > 0 ? (
        <>
          <View style={s.between}>
            <Text style={s.h2}>Popular on campus</Text>
            <Txt muted>Something for every kind of student.</Txt>
          </View>
          <EventGrid
            events={[...upcoming]
              .sort((a, b) => (b.registered ?? 0) - (a.registered ?? 0))
              .slice(0, 3)}
            clubs={data.clubs}
          />
        </>
      ) : null}
      <View style={s.card}>
        <Text style={s.h2}>Bring your club together.</Text>
        <Txt muted>
          Publish events, collect registrations, and organize your committee’s
          shifts in one place.
        </Txt>
        <View style={s.row}>
          <Button
            label="Create a club"
            secondary
            onPress={() => router.push("/manage/new-club")}
          />
        </View>
      </View>
    </Page>
  );
}

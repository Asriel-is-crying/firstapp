import { Image, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  Page,
  Loading,
  Notice,
  Empty,
  EventGrid,
  Button,
  Txt,
  s,
} from "../../components/ui";
import { useAction, useCatalog, useRows } from "../../lib/hooks";
import { useAuth } from "../../lib/auth";
import { Follow } from "../../domain/models";
import { insert, remove } from "../../lib/api";
export default function ClubPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>(),
    q = useCatalog(),
    auth = useAuth();
  const club = q.data?.clubs.find((c) => c.slug === slug),
    f = useRows<Follow>("club_followers", { club_id: club?.id }, !!club);
  const action = useAction(async () => {
    if (!auth.session) {
      router.push({
        pathname: "/auth/login",
        params: { next: "/clubs/" + slug },
      });
      return;
    }
    if (!club) return;
    if (f.data?.length) await remove("club_followers", f.data[0].id);
    else
      await insert("club_followers", {
        club_id: club.id,
        user_id: auth.session.user.id,
      });
  });
  if (q.isPending)
    return (
      <Page>
        <Loading />
      </Page>
    );
  if (q.error)
    return (
      <Page>
        <Notice error={q.error} />
      </Page>
    );
  if (!club)
    return (
      <Page>
        <Empty
          title="Club not found"
          body="Check the link or browse all clubs."
        />
      </Page>
    );
  return (
    <Page
      title={club.name}
      description={club.description.slice(0, 160)}
      image={club.banner_url}
    >
      {club.banner_url ? (
        <Image
          source={{ uri: club.banner_url }}
          style={{ height: 250, borderRadius: 20, width: "100%" }}
        />
      ) : null}
      <View style={s.card}>
        {club.logo_url ? (
          <Image
            source={{ uri: club.logo_url }}
            style={{ width: 80, height: 80, borderRadius: 20 }}
          />
        ) : null}
        <Text style={s.label}>
          {club.verified ? "Verified campus club ✓" : "Verification pending"}
        </Text>
        <Text style={s.title}>{club.name}</Text>
        <Txt>{club.description}</Txt>
        <Txt muted>{club.contact_email}</Txt>
        <View style={s.row}>
          <Button
            label={f.data?.length ? "Unfollow club" : "Follow club"}
            onPress={() => action.mutate()}
            disabled={action.isPending}
          />
        </View>
        <Notice error={action.error ?? f.error} />
      </View>
      <Text style={s.h2}>Events from this club</Text>
      <EventGrid
        events={
          q.data?.events.filter(
            (e) => e.club_id === club.id && e.status !== "draft",
          ) ?? []
        }
        clubs={[club]}
      />
    </Page>
  );
}

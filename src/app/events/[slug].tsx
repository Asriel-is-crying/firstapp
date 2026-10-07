import { useState } from "react";
import { Image, Text, View, useWindowDimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  Page,
  Loading,
  Empty,
  Notice,
  Button,
  NavLink,
  Txt,
  s,
  Field,
} from "../../components/ui";
import { useCatalog, useRows, useAction } from "../../lib/hooks";
import { useAuth } from "../../lib/auth";
import { Registration, Saved } from "../../domain/models";
import { dateLabel, eventState } from "../../domain/logic";
import { insert, remove, rpc } from "../../lib/api";
import { shareLink } from "../../platform/share";
import { publicUrl } from "../../platform/links";
export default function EventPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>(),
    q = useCatalog(),
    auth = useAuth(),
    { width } = useWindowDimensions();
  const event = q.data?.events.find((e) => e.slug === slug),
    club = q.data?.clubs.find((c) => c.id === event?.club_id);
  const reg = useRows<Registration>(
      "event_registrations",
      { event_id: event?.id, user_id: auth.session?.user.id },
      !!event,
    ),
    saved = useRows<Saved>("saved_events", { event_id: event?.id }, !!event);
  const [message, setMessage] = useState(""),
    [shareError, setShareError] = useState<unknown>(),
    [report, setReport] = useState(false),
    [reason, setReason] = useState(""),
    [confirmCancel, setConfirmCancel] = useState(false);
  const action = useAction(async (kind: string) => {
    if (!event) return;
    const uid = auth.session?.user.id;
    if (!uid) {
      router.push({
        pathname: "/auth/login",
        params: { next: "/events/" + slug },
      });
      return;
    }
    if (kind === "register") {
      const result = await rpc<string>("register_event", { p_event: event.id });
      setMessage(
        result === "waitlisted"
          ? "You’re on the waitlist. Check My Events for updates."
          : "You’re registered. See you there!",
      );
    }
    if (kind === "cancel") {
      await rpc("cancel_registration", { p_event: event.id });
      setConfirmCancel(false);
      setMessage("Registration cancelled.");
    }
    if (kind === "save") {
      if (saved.data?.length) await remove("saved_events", saved.data[0].id);
      else await insert("saved_events", { event_id: event.id, user_id: uid });
    }
    if (kind === "report") {
      if (reason.trim().length < 10)
        throw new Error("Please provide at least 10 characters of detail");
      await insert("reports", {
        event_id: event.id,
        reporter_id: uid,
        reason: reason.trim(),
      });
      setReport(false);
      setMessage("Report sent to platform moderators.");
    }
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
  if (!event)
    return (
      <Page>
        <Empty
          title="Event unavailable"
          body="This link may be incorrect, or the event is no longer public."
        />
      </Page>
    );
  const state = eventState(event),
    registration = reg.data?.find((r) => r.status !== "cancelled"),
    open = ["Upcoming", "Waitlist"].includes(state),
    tz = q.data?.universities.find(
      (u) => u.id === club?.university_id,
    )?.timezone;
  return (
    <Page
      title={event.title}
      description={event.description.slice(0, 160)}
      image={event.cover_url}
    >
      <NavLink href="/explore" label="← Explore events" />
      {event.cover_url ? (
        <Image
          source={{ uri: event.cover_url }}
          accessibilityLabel={event.title}
          style={{
            width: "100%",
            height: width < 600 ? 210 : 350,
            borderRadius: 24,
          }}
        />
      ) : null}
      <View style={{ flexDirection: width >= 900 ? "row" : "column", gap: 28 }}>
        <View style={{ flex: 2, gap: 20, minWidth: 0 }}>
          <Text style={s.label}>
            {event.category} · {state}
          </Text>
          <Text style={s.title}>{event.title}</Text>
          <NavLink
            href={"/clubs/" + club?.slug}
            label={
              (club?.name ?? "Club") +
              (club?.verified ? " · Verified ✓" : " · Not yet verified")
            }
          />
          <Text style={s.h2}>Good to know</Text>
          <Txt>{event.description}</Txt>
          <Text style={s.h3}>Questions for the organizers?</Text>
          <Txt>{event.contact_email}</Txt>
          <Button
            label="Report this event"
            secondary
            onPress={() => setReport(!report)}
          />
          {report ? (
            <View style={s.card}>
              <Field
                label="What should we review?"
                value={reason}
                onChange={setReason}
                multiline
              />
              <Button
                label="Submit report"
                onPress={() => action.mutate("report")}
                disabled={action.isPending}
              />
            </View>
          ) : null}
        </View>
        <View
          style={[
            s.card,
            {
              flex: 1,
              alignSelf: width >= 900 ? "flex-start" : "stretch",
              minWidth: 0,
            },
          ]}
        >
          <Text style={s.h2}>
            {Number(event.price) === 0
              ? "Free to join"
              : event.currency + " " + event.price}
          </Text>
          {Number(event.price) > 0 ? (
            <Txt muted>
              Payment is arranged directly with the organizer. CampusFlow does
              not collect payment.
            </Txt>
          ) : null}
          <Txt>↗ {dateLabel(event.starts_at, tz)}</Txt>
          <Txt muted>
            Ends {dateLabel(event.ends_at, tz)} · {tz ?? "local time"}
          </Txt>
          <Txt>⌖ {event.venue}</Txt>
          <Txt muted>
            {event.capacity
              ? `${event.registered ?? 0} / ${event.capacity} registered`
              : "Open capacity"}
          </Txt>
          <Txt muted>
            Registration: {dateLabel(event.registration_opens_at, tz)} –{" "}
            {dateLabel(event.registration_closes_at, tz)}
          </Txt>
          {registration ? (
            <>
              <Notice
                message={
                  registration.status === "waitlisted"
                    ? "You are on the waitlist"
                    : "You are registered"
                }
              />
              {confirmCancel ? (
                <>
                  <Txt>
                    Cancel your place? You may need to rejoin the waitlist
                    later.
                  </Txt>
                  <Button
                    label="Confirm cancellation"
                    disabled={action.isPending}
                    onPress={() => action.mutate("cancel")}
                  />
                  <Button
                    label="Keep my place"
                    secondary
                    onPress={() => setConfirmCancel(false)}
                  />
                </>
              ) : (
                <Button
                  label="Cancel registration"
                  secondary
                  onPress={() => setConfirmCancel(true)}
                />
              )}
            </>
          ) : (
            <Button
              label={
                open
                  ? state === "Waitlist"
                    ? "Join waitlist"
                    : "Register for event"
                  : state
              }
              disabled={!open || action.isPending}
              onPress={() => action.mutate("register")}
            />
          )}
          <Button
            label={saved.data?.length ? "Unsave event" : "Save event"}
            secondary
            disabled={action.isPending}
            onPress={() => action.mutate("save")}
          />
          <Button
            label="Share event"
            secondary
            onPress={() => {
              setShareError(undefined);
              void shareLink(event.title, publicUrl("/events/" + event.slug))
                .then(setMessage)
                .catch(setShareError);
            }}
          />
          <Notice
            error={action.error ?? shareError ?? reg.error ?? saved.error}
            message={message}
          />
        </View>
      </View>
    </Page>
  );
}

import { useState } from "react";
import { Text, View } from "react-native";
import { Href, router, useLocalSearchParams } from "expo-router";
import * as Crypto from "expo-crypto";
import {
  Page,
  RequireAuth,
  Empty,
  Loading,
  Notice,
  Button,
  Choice,
  choices,
  NavLink,
  s,
  Txt,
} from "../../../components/ui";
import { Form } from "../../../components/form";
import { useAuth } from "../../../lib/auth";
import { useAction, useCatalog, useRows } from "../../../lib/hooks";
import { Profile, Registration, categories } from "../../../domain/models";
import { rpc } from "../../../lib/api";
import { uploadImage } from "../../../lib/images";
import { eventSchema } from "../../../domain/validation";
import { slugify } from "../../../domain/logic";
export default function Editor() {
  return (
    <Page title="Event workspace">
      <RequireAuth>
        <Content />
      </RequireAuth>
    </Page>
  );
}
function Content() {
  const [defaultStart] = useState(() =>
    new Date(Date.now() + 7 * 86400000).toISOString(),
  );
  const { id, club: clubParam } = useLocalSearchParams<{
      id: string;
      club: string;
    }>(),
    q = useCatalog(),
    auth = useAuth(),
    event = q.data?.events.find((e) => e.id === id),
    clubId = event?.club_id ?? clubParam;
  const [category, setCategory] = useState(""),
    [status, setStatus] = useState(""),
    [waitlist, setWaitlist] = useState(""),
    [cover, setCover] = useState<string | null>(null);
  const regs = useRows<Registration>(
      "event_registrations",
      { event_id: id },
      id !== "new",
    ),
    profiles = useRows<Profile>("profiles");
  const upload = useAction(async () => {
    const url = await uploadImage("events", id);
    if (url) setCover(url);
  });
  if (q.isPending) return <Loading />;
  if (!auth.memberships.some((m) => m.club_id === clubId && m.role === "admin"))
    return (
      <Empty
        title="Organizer access required"
        body="Choose an event from your club workspace."
      />
    );
  if (id !== "new" && !event)
    return (
      <Empty title="Event unavailable" body="This event could not be found." />
    );
  const cat = category || event?.category || categories[0],
    state = status || event?.status || "draft",
    waiting = waitlist || (event?.waitlist_enabled ? "Yes" : "No");
  return (
    <>
      <NavLink href="/manage" label="← Club workspace" />
      <Text style={s.title}>
        {event ? "Edit your event" : "Something good is coming."}
      </Text>
      <Txt muted>
        Choose dates in your local timezone. CampusFlow stores timestamps in UTC
        and displays public event times in the university’s timezone.
      </Txt>
      <Choice
        label="Category"
        value={cat}
        options={choices(categories)}
        onChange={setCategory}
      />
      <Choice
        label="Publication state"
        value={state}
        options={choices(["draft", "published", "cancelled"])}
        onChange={setStatus}
      />
      <Choice
        label="Waitlist when full"
        value={waiting}
        options={choices(["Yes", "No"])}
        onChange={setWaitlist}
      />
      <Form
        key={id}
        submit={
          state === "published"
            ? "Save and publish event"
            : state === "cancelled"
              ? "Save cancelled event"
              : "Save draft"
        }
        fields={[
          { name: "title", label: "Event title", initial: event?.title },
          {
            name: "description",
            label: "Description",
            multiline: true,
            initial: event?.description,
          },
          { name: "venue", label: "Venue", initial: event?.venue },
          {
            name: "starts_at",
            label: "Start date & time",
            initial: event?.starts_at ?? defaultStart,
          },
          {
            name: "ends_at",
            label: "End date & time",
            initial:
              event?.ends_at ??
              new Date(Date.parse(defaultStart) + 7200000).toISOString(),
          },
          {
            name: "registration_opens_at",
            label: "Registration opens",
            initial: event?.registration_opens_at ?? new Date().toISOString(),
          },
          {
            name: "registration_closes_at",
            label: "Registration closes",
            initial: event?.registration_closes_at ?? defaultStart,
          },
          {
            name: "capacity",
            label: "Capacity (blank for unlimited)",
            initial: event?.capacity?.toString(),
          },
          {
            name: "price",
            label: "Price in MYR (0 for free)",
            initial: event?.price?.toString() ?? "0",
          },
          {
            name: "contact_email",
            label: "Contact email",
            initial: event?.contact_email ?? auth.session?.user.email,
          },
        ]}
        onSubmit={async (v) => {
          const data = eventSchema.parse({
            ...v,
            slug:
              event?.slug ?? slugify(v.title, Crypto.randomUUID().slice(0, 8)),
            category: cat,
            status: state,
            waitlist_enabled: waiting === "Yes",
            capacity: v.capacity.trim() ? Number(v.capacity) : null,
            price: Number(v.price),
            cover_url: cover ?? event?.cover_url ?? null,
          });
          const eid = await rpc<string>("save_event", {
            p_event: id === "new" ? null : id,
            p_club: clubId,
            p_data: data,
          });
          await q.refetch();
          if (id === "new") router.replace(("/manage/events/" + eid) as Href);
          return state === "published"
            ? "Your event is published."
            : "Event saved.";
        }}
      />
      {id !== "new" ? (
        <>
          <Button
            label="Upload cover image"
            secondary
            disabled={upload.isPending}
            onPress={() => upload.mutate()}
          />
          {cover ? (
            <Notice message="Image uploaded. Save the event to apply the cover." />
          ) : null}
          <Notice error={upload.error} />
          <NavLink
            href={"/manage/team/" + id}
            label="Manage event team & shifts →"
          />
          <NavLink href={"/events/" + event?.slug} label="View event page →" />
          <Text style={s.h2}>Registrations</Text>
          <Notice error={regs.error} />
          {regs.data?.map((r) => (
            <View key={r.id} style={s.card}>
              <Txt>
                {profiles.data?.find((p) => p.id === r.user_id)?.display_name ??
                  r.user_id}
              </Txt>
              <Txt muted>{r.status}</Txt>
            </View>
          ))}
          {!regs.data?.length ? <Txt muted>No registrations yet.</Txt> : null}
        </>
      ) : (
        <Txt muted>
          Save the draft first to upload its cover and configure its team.
        </Txt>
      )}
    </>
  );
}

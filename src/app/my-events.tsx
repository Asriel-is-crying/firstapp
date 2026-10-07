import { useState } from "react";
import { Text } from "react-native";
import {
  Page,
  RequireAuth,
  s,
  Choice,
  choices,
  EventGrid,
  Empty,
  Notice,
  Loading,
  NavLink,
} from "../components/ui";
import { useCatalog, useRows } from "../lib/hooks";
import { Registration, Saved } from "../domain/models";
export default function MyEvents() {
  return (
    <Page title="My events">
      <RequireAuth>
        <Content />
      </RequireAuth>
    </Page>
  );
}
function Content() {
  const [now] = useState(() => Date.now());
  const [tab, setTab] = useState("Upcoming"),
    q = useCatalog(),
    regs = useRows<Registration>("event_registrations"),
    saved = useRows<Saved>("saved_events");
  const events =
    q.data?.events.filter((e) =>
      tab === "Saved"
        ? saved.data?.some((r) => r.event_id === e.id)
        : regs.data?.some(
            (r) => r.event_id === e.id && r.status !== "cancelled",
          ) &&
          (tab === "Upcoming"
            ? Date.parse(e.ends_at) >= now
            : Date.parse(e.ends_at) < now),
    ) ?? [];
  return (
    <>
      <Text style={s.title}>Your plans, all together.</Text>
      <NavLink href="/schedule" label="View my committee work schedule →" />
      <Choice
        label="My events"
        value={tab}
        options={choices(["Upcoming", "Past", "Saved"])}
        onChange={setTab}
      />
      <Notice error={q.error ?? regs.error ?? saved.error} />
      {q.isPending || regs.isPending || saved.isPending ? (
        <Loading />
      ) : events.length && q.data ? (
        <EventGrid events={events} clubs={q.data.clubs} />
      ) : (
        <Empty
          title="A little room in your calendar"
          body="Browse campus events and save or register for something you like."
        />
      )}
    </>
  );
}

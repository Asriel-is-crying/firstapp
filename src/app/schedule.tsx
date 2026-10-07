import { useState } from "react";
import { Text, View } from "react-native";
import {
  Page,
  RequireAuth,
  s,
  Txt,
  Choice,
  Notice,
  Button,
  Empty,
  Loading,
} from "../components/ui";
import { Form } from "../components/form";
import { useAuth } from "../lib/auth";
import { useAction, useCatalog, useRows } from "../lib/hooks";
import { Assignment, Availability, Shift, TeamMember } from "../domain/models";
import { insert, remove, rpc } from "../lib/api";
import { dateLabel, overlaps } from "../domain/logic";
export default function Schedule() {
  return (
    <Page title="My work schedule">
      <RequireAuth>
        <Content />
      </RequireAuth>
    </Page>
  );
}
function Content() {
  const auth = useAuth(),
    uid = auth.session!.user.id,
    q = useCatalog(),
    team = useRows<TeamMember>("event_team_members", { user_id: uid }),
    shifts = useRows<Shift>("event_shifts"),
    assignments = useRows<Assignment>("shift_assignments", { user_id: uid }),
    availability = useRows<Availability>("event_availability", {
      user_id: uid,
    });
  const [selected, setSelected] = useState("");
  const action = useAction(
    async ({
      kind,
      id,
      status,
    }: {
      kind: string;
      id: string;
      status?: string;
    }) => {
      if (kind === "respond")
        await rpc("respond_assignment", { p_assignment: id, p_status: status });
      else await remove("event_availability", id);
    },
  );
  const events =
    q.data?.events.filter((e) => team.data?.some((t) => t.event_id === e.id)) ??
    [];
  const myShifts =
    assignments.data
      ?.map((a) => ({
        assignment: a,
        shift: shifts.data?.find((s) => s.id === a.shift_id),
      }))
      .filter((x) => !!x.shift)
      .sort(
        (a, b) =>
          Date.parse(a.shift!.starts_at) - Date.parse(b.shift!.starts_at),
      ) ?? [];
  return (
    <>
      <Text style={s.title}>Your work behind the scenes.</Text>
      <Txt muted>
        Your complete committee schedule, across all clubs. Times are shown in
        your device’s timezone.
      </Txt>
      <Notice
        error={
          q.error ??
          team.error ??
          shifts.error ??
          assignments.error ??
          availability.error ??
          action.error
        }
      />
      {q.isPending || team.isPending ? (
        <Loading />
      ) : !events.length ? (
        <Empty
          title="Your next team is waiting"
          body="Ask a club administrator to add you to an event team. Your events will appear here."
        />
      ) : null}
      <Text style={s.h2}>My assigned shifts</Text>
      {myShifts.map(({ shift, assignment: a }) => {
        if (!shift) return null;
        const conflict =
          a.status !== "declined" &&
          myShifts.some(
            (x) =>
              x.assignment.id !== a.id &&
              x.assignment.status !== "declined" &&
              x.shift &&
              overlaps(shift, x.shift),
          );
        return (
          <View key={a.id} style={s.card}>
            <Text style={s.label}>
              {q.data?.events.find((e) => e.id === shift.event_id)?.title}
            </Text>
            <Text style={s.h2}>{shift.name}</Text>
            <Txt>
              {dateLabel(shift.starts_at)} – {dateLabel(shift.ends_at)}
            </Txt>
            <Txt muted>
              {shift.location} · {a.status}
            </Txt>
            <Txt>{shift.description}</Txt>
            {conflict ? (
              <Notice message="Scheduling conflict: this shift overlaps another assignment. Contact your organizer before confirming." />
            ) : null}
            <View style={s.row}>
              <Button
                label="Confirm shift"
                disabled={
                  action.isPending ||
                  a.status === "confirmed" ||
                  a.status === "declined"
                }
                onPress={() =>
                  action.mutate({
                    kind: "respond",
                    id: a.id,
                    status: "confirmed",
                  })
                }
              />
              <Button
                label="Decline shift"
                secondary
                disabled={action.isPending || a.status === "declined"}
                onPress={() =>
                  action.mutate({
                    kind: "respond",
                    id: a.id,
                    status: "declined",
                  })
                }
              />
            </View>
            {a.status === "declined" ? (
              <Txt muted>
                Ask your organizer to reassign you if your plans change.
              </Txt>
            ) : null}
          </View>
        );
      })}
      <Text style={s.h2}>My availability</Text>
      <Choice
        label="Event"
        value={selected}
        options={events.map((e) => ({ value: e.id, label: e.title }))}
        onChange={setSelected}
      />
      {selected ? (
        <>
          <Form
            key={selected}
            submit="Add availability window"
            fields={[
              {
                name: "starts_at",
                label: "Available from (ISO date with timezone)",
                initial: events.find((e) => e.id === selected)?.starts_at,
              },
              {
                name: "ends_at",
                label: "Available until (ISO date with timezone)",
                initial: events.find((e) => e.id === selected)?.ends_at,
              },
            ]}
            onSubmit={async (v) => {
              const start = new Date(v.starts_at),
                end = new Date(v.ends_at);
              if (
                !Number.isFinite(start.getTime()) ||
                !Number.isFinite(end.getTime()) ||
                end <= start
              )
                throw new Error("Enter valid dates, with end after start");
              await insert("event_availability", {
                event_id: selected,
                user_id: uid,
                starts_at: start.toISOString(),
                ends_at: end.toISOString(),
              });
              await availability.refetch();
              return "Availability added. Add another window if needed.";
            }}
          />
          {availability.data
            ?.filter((a) => a.event_id === selected)
            .map((a) => (
              <View key={a.id} style={[s.card, s.between]}>
                <Txt>
                  {dateLabel(a.starts_at)} – {dateLabel(a.ends_at)}
                </Txt>
                <Button
                  label="Remove window"
                  secondary
                  onPress={() => action.mutate({ kind: "remove", id: a.id })}
                />
              </View>
            ))}
        </>
      ) : null}
    </>
  );
}

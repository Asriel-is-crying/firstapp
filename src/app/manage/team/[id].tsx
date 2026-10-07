import { useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  Page,
  RequireAuth,
  Empty,
  Loading,
  Notice,
  Button,
  Choice,
  Field,
  NavLink,
  s,
  Txt,
} from "../../../components/ui";
import { Form } from "../../../components/form";
import { useAuth } from "../../../lib/auth";
import { useAction, useCatalog, useRows } from "../../../lib/hooks";
import {
  Assignment,
  Availability,
  Membership,
  Profile,
  Role,
  Shift,
  TeamMember,
} from "../../../domain/models";
import { insert, remove, rpc } from "../../../lib/api";
import { dateLabel } from "../../../domain/logic";
export default function Team() {
  return (
    <Page title="Committee & shifts">
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
    event = q.data?.events.find((e) => e.id === id);
  const members = useRows<Membership>(
      "club_memberships",
      { club_id: event?.club_id },
      !!event,
    ),
    team = useRows<TeamMember>("event_team_members", { event_id: id }),
    roles = useRows<Role>("event_team_roles", { event_id: id }),
    shifts = useRows<Shift>("event_shifts", { event_id: id }),
    availability = useRows<Availability>("event_availability", {
      event_id: id,
    }),
    profiles = useRows<Profile>("profiles"),
    assignments = useRows<Assignment>("shift_assignments");
  const [role, setRole] = useState("");
  const action = useAction(
    async ({ kind, key }: { kind: string; key: string }) => {
      if (kind === "member")
        await rpc("add_team_member", { p_event: id, p_user: key });
      if (kind === "delete") await remove("event_shifts", key);
    },
  );
  if (q.isPending) return <Loading />;
  if (
    !event ||
    !auth.memberships.some(
      (m) => m.club_id === event.club_id && m.role === "admin",
    )
  )
    return (
      <Empty
        title="Organizer access required"
        body="Only your club administrators can manage this event team."
      />
    );
  return (
    <>
      <NavLink href="/manage" label="← Club workspace" />
      <Text style={s.title}>{event.title}</Text>
      <Txt muted>
        Build the team. Find the gaps. Give everyone a clear plan.
      </Txt>
      <Notice
        error={
          action.error ??
          team.error ??
          roles.error ??
          shifts.error ??
          availability.error ??
          assignments.error ??
          members.error ??
          profiles.error
        }
      />
      <Text style={s.h2}>1. Event team</Text>
      {members.data?.map((m) => (
        <View style={[s.card, s.between]} key={m.id}>
          <View>
            <Txt>
              {profiles.data?.find((p) => p.id === m.user_id)?.display_name ??
                m.user_id}
            </Txt>
            <Txt muted>
              {team.data?.some((t) => t.user_id === m.user_id)
                ? "On this event team"
                : "Club committee"}
            </Txt>
          </View>
          {!team.data?.some((t) => t.user_id === m.user_id) ? (
            <Button
              label="Add to event"
              secondary
              onPress={() => action.mutate({ kind: "member", key: m.user_id })}
              disabled={action.isPending}
            />
          ) : null}
        </View>
      ))}
      <Text style={s.h2}>2. Team roles</Text>
      <View style={s.row}>
        {roles.data?.map((r) => (
          <View key={r.id} style={s.chip}>
            <Txt>{r.name}</Txt>
          </View>
        ))}
      </View>
      <Form
        submit="Create team role"
        fields={[
          {
            name: "name",
            label: "Role name",
            placeholder: "Registration, photography, logistics…",
          },
        ]}
        onSubmit={async (v) => {
          if (!v.name.trim()) throw new Error("Name the role");
          await insert("event_team_roles", {
            event_id: id,
            name: v.name.trim(),
          });
          await roles.refetch();
        }}
      />
      <Text style={s.h2}>3. Availability</Text>
      <Txt muted>
        Availability is private to each committee member and authorized
        organizers. Members enter it from their work schedule.
      </Txt>
      {team.data?.map((t) => (
        <View key={t.id} style={s.card}>
          <Text style={s.h3}>
            {profiles.data?.find((p) => p.id === t.user_id)?.display_name ??
              t.user_id}
          </Text>
          {availability.data
            ?.filter((a) => a.user_id === t.user_id)
            .map((a) => (
              <Txt key={a.id}>
                {dateLabel(a.starts_at)} – {dateLabel(a.ends_at)}
              </Txt>
            ))}
          {!availability.data?.some((a) => a.user_id === t.user_id) ? (
            <Txt muted>Availability not submitted</Txt>
          ) : null}
        </View>
      ))}
      <Text style={s.h2}>4. Create a work shift</Text>
      <Choice
        label="Team role"
        value={role}
        options={roles.data?.map((r) => ({ value: r.id, label: r.name })) ?? []}
        onChange={setRole}
      />
      <Form
        submit="Create shift"
        fields={[
          { name: "name", label: "Shift name" },
          { name: "description", label: "Responsibilities", multiline: true },
          { name: "location", label: "Location", initial: event.venue },
          {
            name: "starts_at",
            label: "Start (ISO date with timezone)",
            initial: event.starts_at,
          },
          {
            name: "ends_at",
            label: "End (ISO date with timezone)",
            initial: event.ends_at,
          },
          { name: "required_people", label: "People required", initial: "2" },
        ]}
        onSubmit={async (v) => {
          if (!role) throw new Error("Choose a role");
          if (!v.name.trim() || !v.location.trim())
            throw new Error("Enter a name and location");
          const start = new Date(v.starts_at),
            end = new Date(v.ends_at),
            count = Number(v.required_people);
          if (
            !Number.isFinite(start.getTime()) ||
            !Number.isFinite(end.getTime()) ||
            end <= start
          )
            throw new Error("Provide valid dates with end after start");
          if (!Number.isInteger(count) || count < 1 || count > 500)
            throw new Error("Enter 1–500 people");
          await insert("event_shifts", {
            event_id: id,
            role_id: role,
            name: v.name,
            description: v.description,
            location: v.location,
            starts_at: start.toISOString(),
            ends_at: end.toISOString(),
            required_people: count,
          });
          await shifts.refetch();
        }}
      />
      <Text style={s.h2}>5. Staffing & assignments</Text>
      {shifts.data?.map((shift) => (
        <ShiftPanel
          key={shift.id}
          shift={shift}
          team={team.data ?? []}
          profiles={profiles.data ?? []}
          assignments={
            assignments.data?.filter((a) => a.shift_id === shift.id) ?? []
          }
        />
      ))}
      {!shifts.data?.length ? (
        <Empty
          title="No shifts yet"
          body="Create the first shift above, then assign committee members."
        />
      ) : null}
    </>
  );
}
function ShiftPanel({
  shift,
  team,
  profiles,
  assignments,
}: {
  shift: Shift;
  team: TeamMember[];
  profiles: Profile[];
  assignments: Assignment[];
}) {
  const [user, setUser] = useState(""),
    [reason, setReason] = useState(""),
    [override, setOverride] = useState(false),
    [deleteConfirm, setDeleteConfirm] = useState(false);
  const action = useAction(
    async ({ kind, id }: { kind: string; id?: string }) => {
      if (kind === "assign")
        await rpc("assign_shift", {
          p_shift: shift.id,
          p_user: user,
          p_override_reason: override ? reason : null,
        });
      if (kind === "remove")
        await rpc("remove_assignment", { p_assignment: id });
      if (kind === "delete") await remove("event_shifts", shift.id);
    },
  );
  const candidate = useQuery({
    queryKey: ["candidate", shift.id, user, assignments],
    queryFn: () =>
      rpc<string>("candidate_status", { p_shift: shift.id, p_user: user }),
    enabled: !!user,
  });
  const active = assignments.filter((a) => a.status !== "declined"),
    confirmed = active.filter((a) => a.status === "confirmed").length,
    gap = Math.max(0, shift.required_people - active.length),
    needsOverride = candidate.data && candidate.data !== "Available";
  return (
    <View style={s.card}>
      <View style={s.between}>
        <Text style={s.h2}>{shift.name}</Text>
        <Text style={s.label}>
          {active.length} / {shift.required_people} assigned ·{" "}
          {gap ? gap + " needed" : "Staffed"}
        </Text>
      </View>
      <Txt>
        {dateLabel(shift.starts_at)} – {dateLabel(shift.ends_at)} ·{" "}
        {shift.location}
      </Txt>
      <Txt muted>{shift.description}</Txt>
      <Txt muted>
        {confirmed} confirmed · {active.length - confirmed} awaiting response
      </Txt>
      {assignments.map((a) => (
        <View key={a.id} style={s.between}>
          <Txt>
            {profiles.find((p) => p.id === a.user_id)?.display_name ??
              a.user_id}{" "}
            · {a.status}
            {a.override_reason ? " · override recorded" : ""}
          </Txt>
          <Button
            label="Remove assignment"
            secondary
            onPress={() => action.mutate({ kind: "remove", id: a.id })}
            disabled={action.isPending}
          />
        </View>
      ))}
      <Choice
        label="Choose a committee member"
        value={user}
        options={team.map((t) => ({
          value: t.user_id,
          label:
            profiles.find((p) => p.id === t.user_id)?.display_name ?? t.user_id,
        }))}
        onChange={(v) => {
          setUser(v);
          setOverride(false);
          setReason("");
        }}
      />
      {candidate.isFetching && user ? <Loading /> : null}
      {candidate.data ? (
        <Notice message={"Candidate: " + candidate.data} />
      ) : null}
      {needsOverride ? (
        <>
          <Txt>
            Warning: this member has insufficient availability or an overlapping
            assignment. Only override after checking with the member.
          </Txt>
          <Button
            label={
              override
                ? "Override enabled — turn off"
                : "I understand — allow an override"
            }
            secondary
            onPress={() => setOverride(!override)}
          />
          {override ? (
            <Field
              label="Override reason (at least 10 characters)"
              value={reason}
              onChange={setReason}
            />
          ) : null}
        </>
      ) : null}
      <Button
        label="Assign member"
        disabled={
          !user ||
          !candidate.data ||
          candidate.isFetching ||
          action.isPending ||
          !!(needsOverride && (!override || reason.trim().length < 10))
        }
        onPress={() => action.mutate({ kind: "assign" })}
      />
      <Notice error={action.error ?? candidate.error} />
      {deleteConfirm ? (
        <>
          <Txt>Delete this shift and all its assignments?</Txt>
          <Button
            label="Confirm delete shift"
            disabled={action.isPending}
            onPress={() => action.mutate({ kind: "delete" })}
          />
          <Button
            label="Keep shift"
            secondary
            onPress={() => setDeleteConfirm(false)}
          />
        </>
      ) : (
        <Button
          label="Delete shift"
          secondary
          onPress={() => setDeleteConfirm(true)}
        />
      )}
    </View>
  );
}

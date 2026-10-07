import { Text, View } from "react-native";
import {
  Page,
  RequireAuth,
  s,
  Txt,
  Empty,
  Notice,
  NavLink,
} from "../components/ui";
import { Form } from "../components/form";
import { useAuth } from "../lib/auth";
import { useCatalog, useRows } from "../lib/hooks";
import { Report } from "../domain/models";
import { rpc } from "../lib/api";
import { useQueryClient } from "@tanstack/react-query";
export default function Admin() {
  const auth = useAuth();
  return (
    <Page title="Platform moderation">
      <RequireAuth>
        {auth.moderator ? (
          <Content />
        ) : (
          <Empty
            title="Platform administrator access required"
            body="Moderation is restricted to authorized platform administrators."
          />
        )}
      </RequireAuth>
    </Page>
  );
}
function Content() {
  const q = useCatalog(),
    reports = useRows<Report>("reports"),
    qc = useQueryClient();
  const fields = [
    { name: "reason", label: "Review note (required)", multiline: true },
  ];
  async function moderate(action: string, target: string, reason: string) {
    if (reason.trim().length < 10)
      throw new Error("Explain this action in at least 10 characters");
    await rpc("moderate", {
      p_action: action,
      p_target: target,
      p_reason: reason,
    });
    await qc.invalidateQueries();
    return "Moderation action recorded.";
  }
  return (
    <>
      <Text style={s.title}>Keep campus welcoming.</Text>
      <Notice error={q.error ?? reports.error} />
      <Text style={s.h2}>Club verification</Text>
      {q.data?.clubs
        .filter((c) => !c.verified)
        .map((c) => (
          <View key={c.id} style={s.card}>
            <Text style={s.h3}>{c.name}</Text>
            <Txt>{c.contact_email}</Txt>
            <NavLink href={"/clubs/" + c.slug} label="Review club profile" />
            <Form
              fields={fields}
              submit="Verify club"
              onSubmit={(v) => moderate("verify_club", c.id, v.reason)}
            />
          </View>
        ))}
      <Text style={s.h2}>Open reports</Text>
      {reports.data
        ?.filter((r) => r.status === "open")
        .map((r) => (
          <View key={r.id} style={s.card}>
            <Txt>{r.reason}</Txt>
            <Txt muted>
              Event: {r.event_id ?? "—"} · Account: {r.reported_user_id ?? "—"}
            </Txt>
            <Form
              fields={fields}
              submit="Resolve report"
              onSubmit={(v) => moderate("resolve_report", r.id, v.reason)}
            />
            {r.event_id ? (
              <Form
                fields={fields}
                submit="Disable reported event"
                onSubmit={(v) =>
                  moderate("disable_event", r.event_id!, v.reason)
                }
              />
            ) : null}
            {r.reported_user_id ? (
              <Form
                fields={fields}
                submit="Disable reported account"
                onSubmit={(v) =>
                  moderate("disable_user", r.reported_user_id!, v.reason)
                }
              />
            ) : null}
          </View>
        ))}
      <Text style={s.h2}>Account review</Text>
      <Form
        fields={[{ name: "target", label: "Account UUID" }, ...fields]}
        submit="Disable account"
        onSubmit={(v) => moderate("disable_user", v.target, v.reason)}
      />
    </>
  );
}

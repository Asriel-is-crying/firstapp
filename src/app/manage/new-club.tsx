import { useState } from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import * as Crypto from "expo-crypto";
import { Page, RequireAuth, Choice, s, Notice } from "../../components/ui";
import { Form } from "../../components/form";
import { useCatalog } from "../../lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { rpc } from "../../lib/api";
import { email } from "../../domain/validation";
import { slugify } from "../../domain/logic";
export default function NewClub() {
  return (
    <Page title="Create a club">
      <RequireAuth>
        <Content />
      </RequireAuth>
    </Page>
  );
}
function Content() {
  const q = useCatalog(),
    qc = useQueryClient(),
    [university, setUniversity] = useState("");
  return (
    <>
      <Text style={s.title}>Make room for your people.</Text>
      <Choice
        label="University"
        value={university}
        options={
          q.data?.universities.map((u) => ({ label: u.name, value: u.id })) ??
          []
        }
        onChange={setUniversity}
      />
      <Notice error={q.error} />
      <Form
        submit="Create club"
        fields={[
          { name: "name", label: "Club name" },
          { name: "description", label: "About your club", multiline: true },
          { name: "email", label: "Organizer contact email" },
        ]}
        onSubmit={async (v) => {
          if (!university) throw new Error("Choose your university");
          if (v.name.trim().length < 2) throw new Error("Enter your club name");
          email.parse(v.email);
          await rpc("create_club", {
            p_name: v.name.trim(),
            p_slug: slugify(v.name, Crypto.randomUUID().slice(0, 8)),
            p_university: university,
            p_description: v.description,
            p_email: v.email,
          });
          await qc.invalidateQueries();
          router.replace("/manage");
        }}
      />
    </>
  );
}

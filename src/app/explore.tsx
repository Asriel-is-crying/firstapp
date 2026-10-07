import { useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  Page,
  s,
  Field,
  Choice,
  choices,
  Button,
  EventGrid,
  Notice,
  Loading,
  Empty,
} from "../components/ui";
import { useCatalog } from "../lib/hooks";
import { categories } from "../domain/models";
import { defaultFilters, discover } from "../domain/logic";
export default function Explore() {
  const params = useLocalSearchParams<{ category: string }>(),
    q = useCatalog();
  const [f, setF] = useState({
    ...defaultFilters,
    category: params.category ?? defaultFilters.category,
  });
  const [expanded, setExpanded] = useState(false);
  const events = q.data ? discover(q.data.events, q.data.clubs, f) : [];
  return (
    <Page title="Explore events">
      <Text style={s.label}>MAKE SPACE FOR SOMETHING NEW</Text>
      <Text style={s.title}>Find your next thing.</Text>
      <Field
        label="Search events, clubs or keywords"
        value={f.query}
        onChange={(query) => setF({ ...f, query })}
        placeholder="A workshop, a new hobby, your people…"
      />
      <Choice
        label="When"
        value={f.date}
        options={choices(["Any time", "Today", "Tomorrow", "This Week"])}
        onChange={(date) => setF({ ...f, date })}
      />
      <View style={s.row}>
        <Button
          label={expanded ? "Hide filters" : "More filters"}
          secondary
          onPress={() => setExpanded(!expanded)}
        />
        <Button
          label="Clear filters"
          secondary
          onPress={() => setF(defaultFilters)}
        />
      </View>
      {expanded ? (
        <View style={s.card}>
          <Choice
            label="Category"
            value={f.category}
            options={choices(["All categories", ...categories])}
            onChange={(category) => setF({ ...f, category })}
          />
          <Choice
            label="Price"
            value={f.price}
            options={choices(["Any price", "Free", "Paid"])}
            onChange={(price) => setF({ ...f, price })}
          />
          <Choice
            label="Registration"
            value={f.available ? "Open" : "All"}
            options={choices(["All", "Open"])}
            onChange={(v) => setF({ ...f, available: v === "Open" })}
          />
          <Choice
            label="University"
            value={f.university}
            options={[
              { label: "All campuses", value: "" },
              ...(q.data?.universities.map((u) => ({
                value: u.id,
                label: u.name,
              })) ?? []),
            ]}
            onChange={(university) => setF({ ...f, university })}
          />
          <Choice
            label="Club"
            value={f.club}
            options={[
              { label: "All clubs", value: "" },
              ...(q.data?.clubs.map((c) => ({ value: c.id, label: c.name })) ??
                []),
            ]}
            onChange={(club) => setF({ ...f, club })}
          />
        </View>
      ) : null}
      <View style={s.between}>
        <Text style={s.h3}>{events.length} events to discover</Text>
        <Choice
          label="Sort by"
          value={f.sort}
          options={choices(["Soonest", "Newest", "Popular"])}
          onChange={(sort) => setF({ ...f, sort })}
        />
      </View>
      <Notice error={q.error} />
      {q.isPending ? (
        <Loading />
      ) : q.data ? (
        <EventGrid events={events} clubs={q.data.clubs} />
      ) : null}
      {!q.isPending && !q.error && !events.length ? (
        <Empty
          title="Nothing here just yet"
          body="Try another date, category, or search. New events are added by campus clubs."
        />
      ) : null}
    </Page>
  );
}

import { backend, configured } from "./supabase";
import { demoClubs, demoEvents, demoUniversity } from "../data/demo";
import { Club, Event, University } from "../domain/models";
export async function rows<T>(
  table: string,
  filters: Record<string, unknown> = {},
): Promise<T[]> {
  let q = backend().from(table).select("*");
  for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
  const { data, error } = await q;
  if (error) throw error;
  return data as T[];
}
export async function insert(table: string, data: Record<string, unknown>) {
  const { error } = await backend().from(table).insert(data);
  if (error) throw error;
}
export async function update(
  table: string,
  id: string,
  data: Record<string, unknown>,
) {
  const { error } = await backend().from(table).update(data).eq("id", id);
  if (error) throw error;
}
export async function remove(table: string, id: string) {
  const { error } = await backend().from(table).delete().eq("id", id);
  if (error) throw error;
}
export async function rpc<T = unknown>(
  name: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await backend().rpc(name, args);
  if (error) throw error;
  return data as T;
}
export async function catalog() {
  if (!configured)
    return {
      events: demoEvents,
      clubs: demoClubs,
      universities: [demoUniversity],
    };
  const [events, clubs, universities, counts] = await Promise.all([
    rows<Event>("events"),
    rows<Club>("clubs"),
    rows<University>("universities"),
    rpc<{ event_id: string; registered: number }[]>("event_counts"),
  ]);
  return {
    events: events.map((e) => ({
      ...e,
      registered: Number(
        counts.find((c) => c.event_id === e.id)?.registered ?? 0,
      ),
    })),
    clubs,
    universities,
  };
}

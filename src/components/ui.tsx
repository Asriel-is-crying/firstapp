import { ReactNode, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Link, Href, usePathname, router } from "expo-router";
import { useAuth } from "../lib/auth";
import { configured } from "../lib/supabase";
import { Club, Event } from "../domain/models";
import { dateLabel, eventState } from "../domain/logic";
import Head from "expo-router/head";
export const colors = {
  ink: "#153B32",
  muted: "#62726B",
  green: "#226B4E",
  lime: "#DBEF9A",
  paper: "#F7F8F2",
  line: "#DEE4D9",
  white: "#FFFFFF",
  red: "#AC3434",
};
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  content: {
    width: "100%",
    maxWidth: 1240,
    alignSelf: "center",
    padding: 24,
    gap: 24,
    paddingBottom: 110,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    padding: 22,
    gap: 14,
  },
  title: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -1.2,
  },
  h2: {
    fontSize: 23,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.4,
  },
  h3: { fontSize: 18, fontWeight: "700", color: colors.ink },
  text: { fontSize: 15, lineHeight: 23, color: colors.ink },
  muted: { fontSize: 14, lineHeight: 22, color: colors.muted },
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: colors.green,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderColor: "#BDCCC1",
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: colors.ink,
    minHeight: 48,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    minHeight: 42,
    justifyContent: "center",
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontSize: 14, fontWeight: "700", color: colors.white },
  error: { color: colors.red, fontSize: 14, lineHeight: 21 },
  hero: { borderRadius: 24, backgroundColor: colors.ink, padding: 30, gap: 16 },
});
export function Txt({
  children,
  muted = false,
}: {
  children: ReactNode;
  muted?: boolean;
}) {
  return <Text style={muted ? s.muted : s.text}>{children}</Text>;
}
export function Button({
  label,
  onPress,
  disabled = false,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && { backgroundColor: "#EAF0E5" },
        (disabled || pressed) && { opacity: 0.6 },
      ]}
    >
      <Text style={[s.buttonText, secondary && { color: colors.ink }]}>
        {label}
      </Text>
    </Pressable>
  );
}
export function NavLink({
  href,
  label,
  active = false,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href as Href}
      style={{
        fontSize: 14,
        fontWeight: active ? "700" : "500",
        color: active ? colors.green : colors.muted,
        paddingVertical: 12,
        paddingHorizontal: 8,
      }}
    >
      {label}
    </Link>
  );
}
export function Field({
  label,
  value,
  onChange,
  secure = false,
  multiline = false,
  placeholder,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  secure?: boolean;
  multiline?: boolean;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "numeric";
}) {
  return (
    <View style={{ gap: 7, flexGrow: 1 }}>
      <Text style={[s.text, { fontWeight: "600" }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor="#829187"
        autoCapitalize="none"
        keyboardType={keyboardType}
        style={[
          s.input,
          multiline && { minHeight: 110, textAlignVertical: "top" },
        ]}
      />
    </View>
  );
}
export function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.muted}>{label}</Text>
      <View style={s.row}>
        {options.map((o) => (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: o.value === value }}
            onPress={() => onChange(o.value)}
            style={[
              s.chip,
              o.value === value && {
                backgroundColor: colors.ink,
                borderColor: colors.ink,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 13,
                color: o.value === value ? colors.white : colors.ink,
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
export const choices = (items: string[]) =>
  items.map((value) => ({ value, label: value }));
export function Notice({
  error,
  message,
}: {
  error?: unknown;
  message?: string;
}) {
  const text =
    error instanceof Error
      ? error.message
      : error && typeof error === "object" && "message" in error
        ? String(error.message)
        : error
          ? String(error)
          : message;
  return text ? (
    <View
      accessibilityRole="alert"
      style={[
        s.card,
        { padding: 14, backgroundColor: error ? "#FFF0EB" : "#ECF4E2" },
      ]}
    >
      <Text style={error ? s.error : s.text}>{text}</Text>
    </View>
  ) : null;
}
export function Loading() {
  return (
    <View style={{ padding: 40 }}>
      <ActivityIndicator color={colors.green} />
      <Txt muted>Loading CampusFlow…</Txt>
    </View>
  );
}
export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <View style={s.card}>
      <Text style={s.h3}>{title}</Text>
      <Txt muted>{body}</Txt>
    </View>
  );
}
export function Page({
  children,
  title = "CampusFlow",
  description = "Discover your campus. Find events, join clubs, and make room for what you love.",
  image,
}: {
  children: ReactNode;
  title?: string;
  description?: string;
  image?: string | null;
}) {
  const { width } = useWindowDimensions(),
    path = usePathname(),
    auth = useAuth();
  const narrow = width < 768;
  const links = [
    ["/", "Home"],
    ["/explore", "Explore"],
    ["/my-events", "My Events"],
    ["/clubs", "Clubs"],
    ["/profile", "Profile"],
  ];
  return (
    <View style={s.page}>
      <Head>
        <title>
          {title === "CampusFlow" ? title : title + " · CampusFlow"}
        </title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {image ? <meta property="og:image" content={image} /> : null}
        <meta name="theme-color" content={colors.ink} />
      </Head>
      <View
        style={{
          backgroundColor: colors.white,
          borderBottomWidth: 1,
          borderColor: colors.line,
          paddingHorizontal: narrow ? 18 : 32,
          paddingVertical: 12,
        }}
      >
        <View
          style={[
            s.between,
            { maxWidth: 1192, width: "100%", alignSelf: "center" },
          ]}
        >
          <Link
            href="/"
            style={{
              fontWeight: "800",
              fontSize: 24,
              color: colors.ink,
              letterSpacing: -1,
            }}
          >
            ◒ CampusFlow
            <Text
              style={{ color: colors.green, fontSize: 10, letterSpacing: 1 }}
            >
              {" "}
              BETA
            </Text>
          </Link>
          {!narrow ? (
            <View style={s.row}>
              {links.map(([href, label]) => (
                <NavLink
                  key={href}
                  href={href}
                  label={label}
                  active={path === href}
                />
              ))}
            </View>
          ) : null}
          <View style={s.row}>
            {auth.memberships.some((m) => m.role === "admin") ? (
              <NavLink href="/manage" label="Manage Club" />
            ) : null}
            {auth.moderator ? (
              <NavLink href="/admin" label="Moderation" />
            ) : null}
            {!auth.session ? (
              <Button
                label="Log in"
                secondary
                onPress={() => router.push("/auth/login")}
              />
            ) : null}
          </View>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={[s.content, { padding: narrow ? 18 : 28 }]}>
          {!configured ? (
            <View
              style={{
                backgroundColor: "#E8EFD8",
                padding: 10,
                borderRadius: 10,
              }}
            >
              <Text style={{ fontSize: 12, color: colors.ink }}>
                BROWSING DEMO · Sample events. Accounts and changes require
                Supabase setup.
              </Text>
            </View>
          ) : null}
          {children}
          <View
            style={[
              s.between,
              {
                borderTopWidth: 1,
                borderColor: colors.line,
                paddingTop: 24,
                marginTop: 24,
              },
            ]}
          >
            <Txt muted>Your campus. Your people. Your next thing.</Txt>
            <NavLink href="/privacy" label="Privacy & support" />
          </View>
        </View>
      </ScrollView>
      {narrow ? (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            backgroundColor: colors.white,
            borderTopWidth: 1,
            borderColor: colors.line,
            paddingBottom: 10,
            paddingTop: 6,
          }}
        >
          {links.map(([href, label]) => (
            <NavLink
              key={href}
              href={href}
              label={label}
              active={path === href}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading, profile } = useAuth();
  const path = usePathname();
  if (loading) return <Loading />;
  if (!session)
    return (
      <View style={s.card}>
        <Text style={s.h2}>Make it your campus</Text>
        <Txt muted>
          Log in to save events, register, and keep your schedule together.
        </Txt>
        <Button
          label="Log in or create an account"
          onPress={() =>
            router.push({ pathname: "/auth/login", params: { next: path } })
          }
        />
      </View>
    );
  if (profile?.disabled)
    return (
      <Empty
        title="Account disabled"
        body="Contact platform support to review your account."
      />
    );
  return <>{children}</>;
}
export function EventCard({ event, club }: { event: Event; club?: Club }) {
  const [failed, setFailed] = useState(false);
  return (
    <Link href={("/events/" + event.slug) as Href} asChild>
      <Pressable
        accessibilityRole="link"
        style={StyleSheet.flatten([
          s.card,
          { padding: 0, overflow: "hidden", flex: 1, minWidth: 0 },
        ])}
      >
        {event.cover_url && !failed ? (
          <Image
            source={{ uri: event.cover_url }}
            onError={() => setFailed(true)}
            accessibilityLabel={event.title}
            style={{ width: "100%", height: 180 }}
          />
        ) : (
          <View
            style={{
              height: 180,
              backgroundColor: "#DCE7C8",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 48, color: colors.green }}>◒</Text>
          </View>
        )}
        <View style={{ padding: 18, gap: 9 }}>
          <View style={s.between}>
            <Text style={s.label}>{event.category}</Text>
            <Text
              style={{ fontWeight: "700", color: colors.green, fontSize: 12 }}
            >
              {Number(event.price) === 0
                ? "FREE"
                : event.currency + " " + event.price}
            </Text>
          </View>
          <Text numberOfLines={2} style={s.h3}>
            {event.title}
          </Text>
          <Text style={s.muted}>
            {club?.name}
            {club?.verified ? " ✓" : ""}
          </Text>
          <Text style={[s.text, { fontSize: 13 }]}>
            ↗ {dateLabel(event.starts_at)}
          </Text>
          <Text numberOfLines={1} style={s.muted}>
            {event.venue}
          </Text>
          <View style={s.between}>
            <Text style={{ fontSize: 12, color: colors.green }}>
              {eventState(event)}
            </Text>
            <Text style={s.muted}>View event →</Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
export function EventGrid({
  events,
  clubs,
}: {
  events: Event[];
  clubs: Club[];
}) {
  const { width } = useWindowDimensions();
  const columns = width >= 1024 ? 3 : width >= 650 ? 2 : 1;
  return (
    <View style={{ gap: 20 }}>
      {Array.from({ length: Math.ceil(events.length / columns) }, (_, i) => (
        <View key={i} style={{ flexDirection: "row", gap: 20 }}>
          {events.slice(i * columns, (i + 1) * columns).map((e) => (
            <EventCard
              key={e.id}
              event={e}
              club={clubs.find((c) => c.id === e.club_id)}
            />
          ))}
          {Array.from(
            {
              length: Math.max(
                0,
                columns - events.slice(i * columns, (i + 1) * columns).length,
              ),
            },
            (_, j) => (
              <View key={"empty" + j} style={{ flex: 1 }} />
            ),
          )}
        </View>
      ))}
    </View>
  );
}

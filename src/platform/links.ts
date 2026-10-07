import * as Linking from "expo-linking";
export function authUrl(path: string) {
  return Linking.createURL(path);
}
export function publicUrl(path: string) {
  return `${(process.env.EXPO_PUBLIC_SITE_URL ?? "http://localhost:8081").replace(/\/$/, "")}${path}`;
}

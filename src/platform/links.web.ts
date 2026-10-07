export function authUrl(path: string) {
  return `${window.location.origin}/${path.replace(/^\//, "")}`;
}
export function publicUrl(path: string) {
  return `${typeof window === "undefined" ? (process.env.EXPO_PUBLIC_SITE_URL ?? "http://localhost:8081") : window.location.origin}${path}`;
}

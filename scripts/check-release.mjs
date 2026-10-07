try {
  process.loadEnvFile();
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const required = [
  "EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY",
  "EXPO_PUBLIC_SITE_URL",
];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error("Production release requires: " + missing.join(", "));
  process.exit(1);
}
if (!process.env.EXPO_PUBLIC_SITE_URL.startsWith("https://")) {
  console.error("Production site URL must use HTTPS");
  process.exit(1);
}
console.log(
  "Public release configuration is present. Confirm hosted acceptance checks in docs/security-checklist.md.",
);

import { Text, View } from "react-native";
import { s, colors } from "./ui";
function localValue(value: string) {
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return "";
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
export default function DateTimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ gap: 7, minWidth: 0 }}>
      <Text style={[s.text, { fontWeight: "600" }]}>
        {label.replace(/\s*\(ISO date with timezone\)/, "")}
      </Text>
      <input
        aria-label={label}
        type="datetime-local"
        value={localValue(value)}
        onChange={(e) => {
          if (e.target.value) onChange(new Date(e.target.value).toISOString());
          else onChange("");
        }}
        style={{
          boxSizing: "border-box",
          width: "100%",
          minWidth: 0,
          border: "1px solid #BDCCC1",
          background: "#fff",
          borderRadius: 12,
          padding: 13,
          fontSize: 16,
          color: colors.ink,
          fontFamily: "inherit",
          minHeight: 48,
        }}
      />
      <Text style={s.muted}>
        Your local timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
      </Text>
    </View>
  );
}

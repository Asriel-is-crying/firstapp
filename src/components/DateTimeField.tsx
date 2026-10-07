import { Field } from "./ui";
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
    <Field
      label={label + " (ISO date with timezone)"}
      value={value}
      onChange={onChange}
      placeholder="2026-11-14T10:00:00+08:00"
    />
  );
}

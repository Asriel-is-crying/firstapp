import { useForm, Controller } from "react-hook-form";
import { View } from "react-native";
import { useState } from "react";
import { Button, Field, Notice } from "./ui";
import DateTimeField from "./DateTimeField";
export type FormField = {
  name: string;
  label: string;
  initial?: string;
  secure?: boolean;
  multiline?: boolean;
  placeholder?: string;
};
export function Form({
  fields,
  submit,
  onSubmit,
}: {
  fields: FormField[];
  submit: string;
  onSubmit: (values: Record<string, string>) => Promise<string | void>;
}) {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<Record<string, string>>({
    defaultValues: Object.fromEntries(
      fields.map((f) => [f.name, f.initial ?? ""]),
    ),
  });
  const [error, setError] = useState<unknown>(),
    [message, setMessage] = useState("");
  return (
    <View style={{ gap: 16 }}>
      {fields.map((f) => (
        <Controller
          key={f.name}
          name={f.name}
          control={control}
          render={({ field }) =>
            f.name.endsWith("_at") ? (
              <DateTimeField
                label={f.label}
                value={field.value}
                onChange={field.onChange}
              />
            ) : (
              <Field
                label={f.label}
                value={field.value}
                onChange={field.onChange}
                secure={f.secure}
                multiline={f.multiline}
                placeholder={f.placeholder}
              />
            )
          }
        />
      ))}
      <Notice error={error} message={message} />
      <Button
        label={isSubmitting ? "Working…" : submit}
        disabled={isSubmitting}
        onPress={() =>
          void handleSubmit(async (values) => {
            setError(undefined);
            setMessage("");
            try {
              setMessage((await onSubmit(values)) ?? "Saved.");
            } catch (e) {
              setError(e);
            }
          })()
        }
      />
    </View>
  );
}

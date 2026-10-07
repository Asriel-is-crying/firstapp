import * as ImagePicker from "expo-image-picker";
import * as Crypto from "expo-crypto";
import { backend } from "./supabase";
import { validateImage } from "../domain/validation";
export async function uploadImage(
  kind: "profiles" | "clubs" | "events",
  id: string,
) {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.85,
  });
  if (result.canceled) return null;
  const asset = result.assets[0],
    response = await fetch(asset.uri),
    buffer = await response.arrayBuffer();
  const mime = asset.mimeType ?? response.headers.get("content-type") ?? "";
  validateImage(buffer.byteLength, mime);
  const extension =
    mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "webp";
  const path = `${kind}/${id}/${Crypto.randomUUID()}.${extension}`;
  const { error } = await backend()
    .storage.from("campus-images")
    .upload(path, buffer, { contentType: mime, upsert: false });
  if (error) throw error;
  return backend().storage.from("campus-images").getPublicUrl(path).data
    .publicUrl;
}

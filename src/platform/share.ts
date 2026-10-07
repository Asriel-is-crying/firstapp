import { Share } from "react-native";
export async function shareLink(title: string, url: string) {
  await Share.share({ title, message: `${title}\n${url}`, url });
  return "Share opened";
}

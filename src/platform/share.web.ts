export async function shareLink(title: string, url: string) {
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return "Share opened";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return "";
    }
  }
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(url);
    return "Link copied";
  }
  throw new Error(`Copy this link: ${url}`);
}

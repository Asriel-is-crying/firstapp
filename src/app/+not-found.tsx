import { Page, Empty, NavLink } from "../components/ui";
export default function NotFound() {
  return (
    <Page title="Page not found">
      <Empty
        title="This path leads off campus."
        body="The page may have moved. Let’s find something good."
      />
      <NavLink href="/explore" label="Explore events →" />
    </Page>
  );
}

import { Redirect } from "expo-router";

/** The app opens on the dashboard tab. */
export default function Index() {
  return <Redirect href="/home" />;
}

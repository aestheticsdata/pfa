import { DesignSystemScreen } from "@screens/designSystem/DesignSystemScreen";
import { Redirect } from "expo-router";

/** Handoff screen 15, reachable in dev builds only. */
export default function DesignSystemRoute() {
  return __DEV__ ? <DesignSystemScreen /> : <Redirect href="/" />;
}

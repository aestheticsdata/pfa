/**
 * The API the app talks to: production by default, overridable per build with
 * `EXPO_PUBLIC_API_URL` (e.g. a local nest-api reachable from the simulator: http://localhost:6100/api).
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://pfa.1991computer.com/api";

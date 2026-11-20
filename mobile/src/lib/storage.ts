import { createMMKV } from "react-native-mmkv";

/**
 * Device-local key/value store for preferences and the query cache. Never secrets: the API token
 * lives in expo-secure-store (Keychain / Keystore), not here.
 */
export const storage = createMMKV({ id: "pfa" });

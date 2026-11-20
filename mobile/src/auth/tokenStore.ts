import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "pfa-api-token";

/**
 * The API token lives in the Keychain (iOS) / Keystore (Android), readable only while the device
 * is unlocked and never restored onto another device. Never in MMKV or AsyncStorage.
 */
const OPTIONS: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export const readToken = () => SecureStore.getItemAsync(TOKEN_KEY, OPTIONS);

export const saveToken = (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token, OPTIONS);

export const clearToken = () => SecureStore.deleteItemAsync(TOKEN_KEY, OPTIONS);

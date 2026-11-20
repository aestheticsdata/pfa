// Reanimated and Gesture Handler ship their own Jest mocks; MMKV is replaced by an in-memory map.
require("react-native-gesture-handler/jestSetup");

jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));

jest.mock("react-native-mmkv", () => {
  const store = new Map();
  return {
    createMMKV: () => ({
      getString: (key) => store.get(key),
      getNumber: (key) => store.get(key),
      set: (key, value) => store.set(key, value),
      remove: (key) => store.delete(key),
    }),
  };
});

jest.mock("expo-secure-store", () => {
  const store = new Map();
  return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1,
    getItemAsync: async (key) => store.get(key) ?? null,
    setItemAsync: async (key, value) => void store.set(key, value),
    deleteItemAsync: async (key) => void store.delete(key),
  };
});

// Reanimated and Gesture Handler ship their own Jest mocks; MMKV is replaced by an in-memory map.
require("react-native-gesture-handler/jestSetup");

jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));

jest.mock("react-native-mmkv", () => {
  const store = new Map();
  return {
    createMMKV: () => ({
      getString: (key) => store.get(key),
      set: (key, value) => store.set(key, value),
      remove: (key) => store.delete(key),
    }),
  };
});

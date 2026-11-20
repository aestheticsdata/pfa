/** jest-expo, with the tsconfig aliases mirrored and pnpm's `.pnpm` store let through Babel. */
const ALIASES = ["app", "auth", "charts", "hooks", "lib", "navigation", "screens", "stores", "text", "theme", "ui"];

module.exports = {
  preset: "jest-expo",
  setupFiles: ["./jest.setup.js"],
  testMatch: ["<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}"],
  moduleNameMapper: Object.fromEntries(ALIASES.map((alias) => [`^@${alias}/(.*)$`, `<rootDir>/src/${alias}/$1`])),
  transformIgnorePatterns: [
    "node_modules/(?!(\\.pnpm|(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|react-native-svg|@shopify/.*|lucide-react-native|@pfa/shared))",
  ],
};

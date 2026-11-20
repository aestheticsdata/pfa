This is PFA's Expo / React Native client (epic PFA-284), beside the Next.js web client and on the same NestJS API.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. Before writing code that touches an Expo or React Native API, read the
major version of `expo` in `package.json`, then the matching docs: `https://docs.expo.dev/versions/v<major>.0.0/`, or
https://docs.expo.dev/llms.txt for anything else. Never answer from memory.

## Commands

```bash
pnpm expo install <package>   # never pnpm add for Expo/RN packages: resolves SDK-compatible versions
pnpm expo install --check     # versions aligned with the SDK (TypeScript is excluded: house rule, 5.9.3)
pnpm lint                     # Biome + exported types only in interfaces/
pnpm typecheck
pnpm test                     # Jest + React Native Testing Library (render is async: await it)
pnpm ios                      # expo run:ios — dev build on the simulator
pnpm android                  # expo run:android
```

Run lint, typecheck and tests before declaring any task done.

## Rules of this app

- **Own APIs only.** No Google, Firebase, Expo services (EAS, push service), nothing paid. Builds are local
  (`expo prebuild` + Xcode / Gradle); `ios/` and `android/` are generated and never committed or edited by hand.
- **Design handoff** in `design/`: `screens/NN-*.png` rule the layout (light left, dark right), `SPEC.md` the
  behaviour, `src/theme/tokens.ts` every visual value. No colour, size or radius typed in a screen.
- Routes live in `src/app/`; everything else outside it, imported through the tsconfig aliases (`@ui/…`,
  `@theme/…`), never a relative path.
- Data comes from `@pfa/shared` (`packages/shared`): schemas, fetchers, money in integer cents, week model
  (Sunday → Saturday, truncated to the month).
- React: no `useMemo` / `useCallback` / `memo` (React Compiler), enum-like values as `as const` objects, effects in
  named hooks under `src/hooks/`, user-facing copy in `src/text/fr/`.

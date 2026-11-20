# PFA mobile

The native iOS + Android client of PFA, in Expo (SDK 58) and Expo Router, on the same NestJS API as the web.
Epic PFA-284.

| Folder | Holds |
| --- | --- |
| `src/app/` | Routes: four tabs with their own stacks, form sheets (quick add, category edit), the dev-only design system. |
| `src/ui/` | The UI kit, built on the tokens: Button, Card (GlowCard), Amount, Meter, ListRow, Chip, Segmented, Sheet, states… |
| `src/charts/` | Charts drawn with React Native Skia on the GPU; their maths in `charts/lib/`, unit-tested. |
| `src/navigation/` | The tab bar per platform: glass capsule + « + » on iOS, Material 3 bar + extended FAB on Android. |
| `src/theme/` | Design tokens (from the Claude Design handoff), System / Light / Dark preference kept in MMKV. |
| `design/` | The handoff: screenshots (light / dark), static HTML with exact values, `SPEC.md`. |

## Run it

```bash
pnpm install          # from the repo root: installs the workspace (packages/shared + mobile)
cd mobile
pnpm ios              # builds and opens the app on the iOS simulator
pnpm android          # same on an Android emulator or device
```

The design-system screen (handoff 15) opens from the dashboard in development builds.

import RunnerBrand from "@components/brand/RunnerBrand";
import AppCard from "@components/panel/picker/AppCard";
import SignOutButton from "@components/panel/topBar/SignOutButton";
import { PANEL_TEXT } from "@text/panel";

import type { AppPickerProps } from "@components/panel/picker/interfaces/pickerTypes";

/** "Choose an app", in the bot-runner identity: shown only after sign-in, and only with 2+ apps. */
const AppPicker = ({ apps, email }: AppPickerProps) => (
  <div className="theme-runner min-h-dvh bg-bg text-text">
    <header className="rule-b flex items-center gap-3 px-gut py-2">
      <RunnerBrand size={26} />
      <span className="flex-1" />
      <span className="hidden max-w-50 truncate font-mono text-xs text-dim tablet:inline">{email}</span>
      <SignOutButton />
    </header>
    <main className="mx-auto max-w-picker px-gut pb-10">
      <h1 className="mt-9 mb-4 text-xl font-semibold tracking-figure">{PANEL_TEXT.picker.title}</h1>
      <div className="grid gap-2.5">
        {apps.map((app) => (
          <AppCard
            key={app.id}
            app={app}
          />
        ))}
      </div>
      <p className="mt-7 font-mono text-xs text-dim">{PANEL_TEXT.picker.connected(apps.length)}</p>
    </main>
  </div>
);

export default AppPicker;

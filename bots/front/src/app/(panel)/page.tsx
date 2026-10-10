import AppPicker from "@components/panel/picker/AppPicker";
import { pageData, SIGN_IN_EXPIRED } from "@lib/api/server";
import { readAuthState } from "@lib/auth/authState";
import { appPath } from "@lib/panel/routes";
import { PANEL_VIEW } from "@lib/panel/views";
import { redirect } from "next/navigation";

import type { AppSummary } from "@contracts/interfaces/panelTypes";

/** After sign-in: the app picker — skipped when there is only one app. */
const PickerPage = async () => {
  const auth = await readAuthState();
  if (!auth.signedIn || !auth.email) redirect(SIGN_IN_EXPIRED);
  const apps = await pageData<AppSummary[]>("/apps");
  const [only] = apps;
  if (apps.length === 1 && only) redirect(appPath(only.id, PANEL_VIEW.overview));
  return (
    <AppPicker
      apps={apps}
      email={auth.email}
    />
  );
};

export default PickerPage;

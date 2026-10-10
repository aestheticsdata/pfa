"use client";

import useApply from "@components/hooks/useApply";
import Switch from "@components/ui/Switch";
import { setAction } from "@lib/panel/panelActions";
import { ACTIONS_TEXT } from "@text/metrics";

import type { ActionSwitchProps } from "@components/panel/actions/interfaces/actionSwitchTypes";

/** An action on or off for every bot of the app, at once. */
const ActionSwitch = ({ app, action }: ActionSwitchProps) => {
  const { pending, apply } = useApply();
  return (
    <Switch
      small
      on={action.enabled}
      disabled={pending}
      label={ACTIONS_TEXT.toggle(action.name)}
      testId={`action-switch-${action.name}`}
      onToggle={() =>
        apply(
          () => setAction({ app, name: action.name, enabled: !action.enabled }),
          ACTIONS_TEXT.turned(action.name, !action.enabled),
        )
      }
    />
  );
};

export default ActionSwitch;

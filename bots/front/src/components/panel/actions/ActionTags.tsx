import Tag from "@components/ui/Tag";
import { TONE } from "@components/ui/variants";
import { ACTIONS_TEXT } from "@text/metrics";

import type { ActionTagsProps } from "@components/panel/actions/interfaces/actionsTypes";

/** `budget` (spends the upload budget) and `quiet hours` (paused in the quiet window). */
const ActionTags = ({ action }: ActionTagsProps) => (
  <>
    {action.budget && <Tag tone={TONE.warn}>{ACTIONS_TEXT.budget}</Tag>}
    {action.quiet && <Tag>{ACTIONS_TEXT.quiet}</Tag>}
  </>
);

export default ActionTags;

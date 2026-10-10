import Tag from "@components/ui/Tag";
import { TONE } from "@components/ui/variants";
import { BOT_KIND } from "@contracts/panel";

import type { KindTagProps } from "@components/panel/bots/interfaces/botsTypes";

/** `daily` (info) or `load` (neutral). */
const KindTag = ({ kind }: KindTagProps) => <Tag tone={kind === BOT_KIND.daily ? TONE.info : TONE.neutral}>{kind}</Tag>;

export default KindTag;

import LocalTime from "@components/ui/LocalTime";

import type { RefreshedAtProps } from "@components/panel/topBar/interfaces/refreshedTypes";

/** The refresh time, on the browser's clock. */
const RefreshedAt = ({ iso }: RefreshedAtProps) => <LocalTime iso={iso} />;

export default RefreshedAt;

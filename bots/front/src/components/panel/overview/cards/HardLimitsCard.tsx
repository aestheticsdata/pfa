import LimitRow from "@components/panel/overview/cards/LimitRow";
import Card from "@components/ui/Card";
import CardHeader from "@components/ui/CardHeader";
import { OVERVIEW_TEXT } from "@text/overview";

import type { StatusOnlyProps } from "@components/panel/overview/interfaces/overviewTypes";

const NEAR_CAP = 0.9;

/** The runner's caps, read-only: they come from its environment, nothing here can raise them. */
const HardLimitsCard = ({ status }: StatusOnlyProps) => {
  const text = OVERVIEW_TEXT.limits;
  const { limits } = status;
  const rpsShare = limits.maxRps ? status.rps / limits.maxRps : 0;
  return (
    <Card
      testId="limits-card"
      className="tablet:col-span-full roomy:col-auto"
    >
      <CardHeader
        title={text.title}
        sub={text.sub}
      />
      <div className="pt-1.5">
        <LimitRow
          label={text.bots}
          value={String(limits.maxBots)}
          keyLine={text.botsKey(status.target)}
          share={limits.maxBots ? status.target / limits.maxBots : 0}
        />
        <LimitRow
          label={text.rps}
          value={String(limits.maxRps)}
          keyLine={text.rpsKey(status.rps.toFixed(1))}
          share={rpsShare}
          warn={rpsShare > NEAR_CAP}
        />
        <LimitRow
          label={text.upload}
          value={`${limits.uploadBudgetMB} MB`}
          keyLine={text.uploadKey(limits.windowDays)}
          share={status.uploadBudget.budgetMB ? status.uploadBudget.usedMB / status.uploadBudget.budgetMB : 0}
        />
      </div>
    </Card>
  );
};

export default HardLimitsCard;

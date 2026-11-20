import { DailyCurve } from "@charts/DailyCurve";
import { DemoSection } from "@screens/designSystem/DemoSection";
import { designSystemText } from "@text/fr/designSystem";
import { layout } from "@theme/tokens";
import { Card } from "@ui/Card";

/** Invented daily totals, in cents: a calm month with one spike. */
const SAMPLE_DAYS = [
  3_200, 4_900, 2_100, 5_600, 3_900, 4_400, 6_100, 3_100, 3_500, 7_900, 2_800, 4_100, 3_600, 4_000, 32_273, 2_500,
  3_300, 4_200, 3_900, 5_061,
];

export const ChartSection = () => (
  <DemoSection title={designSystemText.sections.chart}>
    <Card>
      <DailyCurve
        values={SAMPLE_DAYS}
        height={layout.chartHeight}
        label={designSystemText.chart.label}
      />
    </Card>
  </DemoSection>
);

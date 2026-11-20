import { DemoSection } from "@screens/designSystem/DemoSection";
import { designSystemText } from "@text/fr/designSystem";
import { useTheme } from "@theme/useTheme";
import { Amount } from "@ui/Amount";
import { AppText } from "@ui/AppText";
import { Card } from "@ui/Card";
import { CategoryMarker } from "@ui/CategoryMarker";
import { ListRow } from "@ui/ListRow";
import { SectionHeader } from "@ui/SectionHeader";
import { Toggle } from "@ui/Toggle";
import { useState } from "react";
import { View } from "react-native";

const DAY_TOTAL_CENTS = 32_699;
const ROW_CENTS = 6_514;

export const RowsSection = () => {
  const { categoryColors, layout, radius } = useTheme();
  const [alert, setAlert] = useState(true);
  const { rows } = designSystemText;
  return (
    <DemoSection title={designSystemText.sections.rows}>
      <View>
        <SectionHeader
          title={rows.day}
          trailing={<Amount cents={DAY_TOTAL_CENTS} />}
        />
        <Card padding={0}>
          <ListRow
            title={rows.shop}
            subtitle={rows.restaurants}
            leading={<CategoryMarker color={categoryColors.restaurants} />}
            trailing={<Amount cents={ROW_CENTS} />}
            onPress={() => {}}
          />
          <ListRow
            title={rows.groceries}
            leading={
              <View
                style={{
                  width: layout.categoryTile,
                  height: layout.categoryTile,
                  borderRadius: radius.xs,
                  backgroundColor: categoryColors.groceries,
                }}
              />
            }
            trailing={
              <AppText
                variant="amountS"
                color="ink3"
              >
                {rows.groceriesShare}
              </AppText>
            }
            chevron
            onPress={() => {}}
          />
          <ListRow
            title={rows.weeklyCeiling}
            trailing={
              <Toggle
                value={alert}
                onValueChange={setAlert}
                label={rows.weeklyCeiling}
              />
            }
            last
          />
        </Card>
      </View>
    </DemoSection>
  );
};

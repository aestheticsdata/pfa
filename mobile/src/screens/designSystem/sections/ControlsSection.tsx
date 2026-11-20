import { DemoSection } from "@screens/designSystem/DemoSection";
import { designSystemText } from "@text/fr/designSystem";
import { useTheme } from "@theme/useTheme";
import { Chip } from "@ui/Chip";
import { Segmented } from "@ui/Segmented";
import { Toggle } from "@ui/Toggle";
import { useState } from "react";
import { View } from "react-native";

const BREAKDOWN = { byStore: "byStore", byDay: "byDay" } as const;

const OPTIONS = [
  { value: BREAKDOWN.byStore, label: designSystemText.controls.byStore },
  { value: BREAKDOWN.byDay, label: designSystemText.controls.byDay },
] as const;

export const ControlsSection = () => {
  const { categoryColors, space } = useTheme();
  const [breakdown, setBreakdown] = useState<(typeof BREAKDOWN)[keyof typeof BREAKDOWN]>(BREAKDOWN.byStore);
  const [allSelected, setAllSelected] = useState(true);
  const [alert, setAlert] = useState(false);
  const { controls } = designSystemText;
  return (
    <DemoSection title={designSystemText.sections.controls}>
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <Chip
          label={controls.all}
          count={13}
          selected={allSelected}
          onPress={() => setAllSelected(true)}
        />
        <Chip
          label={controls.groceries}
          count={4}
          dotColor={categoryColors.groceries}
          selected={!allSelected}
          onPress={() => setAllSelected(false)}
        />
      </View>
      <Segmented
        label={controls.breakdown}
        options={OPTIONS}
        value={breakdown}
        onChange={setBreakdown}
      />
      <Toggle
        value={alert}
        onValueChange={setAlert}
        label={controls.switchLabel}
      />
    </DemoSection>
  );
};

import { useTheme } from "@theme/useTheme";
import { Switch } from "react-native";

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label: string;
}

/** The platform's own switch — iOS 51×31, Material 3 on Android — tinted `accent`. */
export const Toggle = ({ value, onValueChange, label }: ToggleProps) => {
  const { colors } = useTheme();
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      accessibilityLabel={label}
      trackColor={{ false: colors.surface3, true: colors.accent }}
      thumbColor={colors.surface}
      ios_backgroundColor={colors.surface3}
    />
  );
};

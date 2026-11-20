import { useTheme } from "@theme/useTheme";
import { View } from "react-native";

interface CategoryMarkerProps {
  color: string;
  /** The 8×8 dot of a chip or a legend instead of the 4×30 bar of a list row. */
  dot?: boolean;
}

/** A category's colour, only ever as a marker or a dot — never as a background (handoff rule 6). */
export const CategoryMarker = ({ color, dot }: CategoryMarkerProps) => {
  const { layout, radius } = useTheme();
  const size = dot
    ? { width: layout.categoryDot, height: layout.categoryDot, borderRadius: radius.xs / 2 }
    : { ...layout.categoryMarker, borderRadius: layout.categoryMarker.width / 2 };
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[size, { backgroundColor: color }]}
    />
  );
};

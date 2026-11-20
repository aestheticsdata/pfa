import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { useTheme } from "@theme/useTheme";

import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import type { ReactNode, Ref } from "react";

interface SheetProps {
  ref: Ref<BottomSheetModal>;
  children: ReactNode;
  /** Detents, e.g. ["50%", "90%"] — medium and large. */
  snapPoints?: (string | number)[];
}

/**
 * An in-screen bottom sheet (month picker, category picker…): `sheet` background, 28 radius on
 * top, 36×5 grabber, `scrim` backdrop, dismissed by a swipe down or a tap outside. Screens that
 * are sheets in their own right (quick add) use the router's native `formSheet` instead.
 */
export const Sheet = ({ ref, children, snapPoints }: SheetProps) => {
  const { colors, radius, layout, space } = useTheme();
  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enableDynamicSizing={!snapPoints}
      backgroundStyle={{
        backgroundColor: colors.sheet,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
      }}
      handleIndicatorStyle={{
        width: layout.sheetGrabber.width,
        height: layout.sheetGrabber.height,
        backgroundColor: colors.line,
      }}
      backdropComponent={(props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          style={[props.style, { backgroundColor: colors.scrim }]}
          opacity={1}
        />
      )}
    >
      <BottomSheetView style={{ paddingHorizontal: layout.screenMargin, paddingBottom: space.xxxl }}>
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
};

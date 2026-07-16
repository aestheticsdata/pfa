import adjustFontColor from "@components/common/helpers/adjustFontColor";
import common from "@text/common";

import type { CategoryProps } from "@src/interfaces/category";

interface CategoryComponentProps {
  item: CategoryProps;
  customCss?: string;
  isDynamic?: boolean;
  isClicked?: boolean;
}

const CategoryComponent = ({ item, customCss = "", isDynamic = false, isClicked = false }: CategoryComponentProps) => {
  const resolvedColor = item.categoryColor ?? "#ffffff";

  const getBackgroundColor = () => {
    if (isDynamic && isClicked) {
      return resolvedColor;
    } else if (isDynamic) {
      return resolvedColor;
    } else {
      return "#efefef";
    }
  };

  const getTextColor = () => {
    return isDynamic ? adjustFontColor(resolvedColor) : "#000";
  };

  return (
    <div
      className={`relative flex items-center px-0.5 rounded-sm ${isDynamic ? "text-3xs" : "text-2xs"} uppercase ${customCss}`}
      style={{
        color: getTextColor(),
        backgroundColor: getBackgroundColor(),
      }}
    >
      {!isDynamic && (
        <span
          className="absolute left-0 top-0 bottom-0 w-[5px] rounded-l-[inherit]"
          style={{
            border: resolvedColor,
            backgroundColor: resolvedColor,
          }}
        ></span>
      )}
      <span className="mx-auto z-10">{item.category || common.category.uncategorized}</span>
    </div>
  );
};

export default CategoryComponent;

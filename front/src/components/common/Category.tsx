import adjustFontColor from "@components/common/helpers/adjustFontColor";

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
      className={`relative flex items-center px-0.5 rounded-sm ${isDynamic ? "text-tiny" : "text-xxs"} uppercase ${customCss}`}
      style={{
        // border: `1px solid ${item.categoryColor}`,
        // borderRadius: "4px",
        color: getTextColor(),
        backgroundColor: getBackgroundColor(),
      }}
    >
      {!isDynamic && (
        <span
          className="absolute left-0 top-0 bottom-0"
          style={{
            border: resolvedColor,
            backgroundColor: resolvedColor,
            width: "5px",
            borderTopLeftRadius: "inherit",
            borderBottomLeftRadius: "inherit",
          }}
        ></span>
      )}
      <span className="mx-auto z-10">{item.category || "sans catégorie"}</span>
    </div>
  );
};

export default CategoryComponent;

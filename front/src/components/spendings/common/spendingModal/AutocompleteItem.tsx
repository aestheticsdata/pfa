import adjustFontColor from "@components/shared/helpers/adjustColor";
import type {
  HTMLAttributes,
  Key,
  MouseEventHandler,
} from "react";

type AutocompleteRenderOptionProps = HTMLAttributes<HTMLLIElement> & {
  key?: Key;
};

interface AutocompleteListProps {
  props: AutocompleteRenderOptionProps;
  color: string;
  name: string;
}

const AutocompleteItem = ({ props, color, name }: AutocompleteListProps) => {
  const {
    key: optionKey,
    onMouseOver,
    onMouseOut,
    ...optionProps
  } = props;

  const handleMouseOver: MouseEventHandler<HTMLLIElement> = (event) => {
    onMouseOver?.(event);
    event.currentTarget.style.backgroundColor = "rgb(220, 220, 220)";
  };

  const handleMouseOut: MouseEventHandler<HTMLLIElement> = (event) => {
    onMouseOut?.(event);
    event.currentTarget.style.backgroundColor = "white";
  };

  return (
    <li
      key={optionKey}
      {...optionProps}
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "7px 0",
        backgroundColor: "white",
      }}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
    >
      <span
        style={{
          display: "flex",
          justifyContent: "center",
          marginLeft: "5px",
          backgroundColor: color,
          width: "110px",
          color: adjustFontColor(color),
          borderRadius: "3px",
          fontSize: "10px",
          padding: "2px 10px",
          textTransform: "uppercase",
        }}
      >
        {name}
      </span>
    </li>
  );
};

export default AutocompleteItem;

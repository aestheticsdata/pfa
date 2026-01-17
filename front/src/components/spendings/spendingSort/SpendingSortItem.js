import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSort } from "@fortawesome/free-solid-svg-icons";
import spendingsText from "@components/spendings/config/text";

const SpendingSortItem = ({ name, onClickSort }) => {
  const { sortItem } = spendingsText;

  return (
    <div
      className="px-1 space-x-1 border border-sortbutton rounded-sm hover:text-sortButtonHover hover:cursor-pointer"
      onClick={() => onClickSort(name)}
    >
      <span>
        {sortItem[name]}
      </span>
      <FontAwesomeIcon
        icon={faSort}
        className="icon"
      />
    </div>
  );
};

export default SpendingSortItem;

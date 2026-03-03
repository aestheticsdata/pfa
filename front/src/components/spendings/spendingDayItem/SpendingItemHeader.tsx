import format from "date-fns/format";
import fr from "date-fns/locale/fr";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusSquare } from "@fortawesome/free-solid-svg-icons";
import spendingsText from "@components/spendings/config/text";

interface SpendingItemHeaderProps {
  date?: Date;
  recurringType: boolean;
  isToday: boolean;
  addSpending: () => void;
  addSpendingEnabled: boolean;
}

const SpendingItemHeader = ({ date, recurringType, isToday, addSpending, addSpendingEnabled }: SpendingItemHeaderProps) => {
  return (
    <div className="flex h-10 justify-around items-center">
      {(!!date || recurringType) && (
        !recurringType
          ?
          <div className={`flex font-poppins uppercase ${isToday ? "bg-datePickerWrapper" : "bg-grey01"} text-blueNavy justify-center font-bold text-sm items-center rounded-sm w-5/6 h-6`}>
            <div>{date ? format(date, "dd MMM yyyy", { locale: fr }) : ""}</div>
          </div>
          :
          <div className="flex text-grey2 uppercase justify-center items-center font-bold text-sm bg-grey0 rounded-sm w-5/6">
            {spendingsText.dayItem.recurringTitle}
          </div>
      )
      }
      <div
        className={`select-none cursor-pointer text-grey1 text-xl hover:text-addSpendingHover ${!addSpendingEnabled && "cursor-not-allowed hover:text-grey1"}`}
        onClick={addSpending}
      >
        <FontAwesomeIcon icon={faPlusSquare} />
      </div>
    </div>
  )
};

export default SpendingItemHeader;

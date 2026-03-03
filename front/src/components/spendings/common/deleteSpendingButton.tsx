import commonTexts from "@components/common/config/text";
import useSpendings from "@components/spendings/services/useSpendings";
import useReccurings from "@components/spendings/services/useReccurings";

interface DeletableSpending {
  ID: string;
  itemType: string;
}

interface DeleteSpendingButtonProps {
  spending: DeletableSpending;
  recurringType: boolean;
  hideConfirm: () => void;
}

const DeleteSpendingButton = ({ spending, recurringType, hideConfirm }: DeleteSpendingButtonProps) => {
  const { deleteSpending } = useSpendings();
  const { deleteRecurring } = useReccurings();

  return (
    <button
      className="border border-grey1 bg-grey0 px-0.5 rounded-sm hover:bg-grey1 hover:text-white"
      onClick={
        () => {
          recurringType ?
            deleteRecurring.mutate({ recurring: spending })
            :
            deleteSpending.mutate({ spending });
          hideConfirm();
        }
      }>
      {commonTexts.deletePopin.delete}
    </button>
  );
}

export default DeleteSpendingButton;

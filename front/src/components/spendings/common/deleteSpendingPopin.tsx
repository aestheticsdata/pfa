import ConfirmDelete from "@components/common/confirmDelete";
import DeleteSpendingButton from "@components/spendings/common/deleteSpendingButton";

interface DeletableSpending {
  ID: string;
  itemType: string;
}

interface ConfirmDeletePopinProps {
  hideConfirm: () => void;
  spending: DeletableSpending;
  recurringType: boolean;
}

const ConfirmDeleteSpendingPopin = ({ hideConfirm, spending, recurringType }: ConfirmDeletePopinProps) => {
 return (
   <ConfirmDelete hideConfirm={hideConfirm}>
     <DeleteSpendingButton
       hideConfirm={hideConfirm}
       spending={spending}
       recurringType={recurringType}
     />
   </ConfirmDelete>
 )
};

export default ConfirmDeleteSpendingPopin;

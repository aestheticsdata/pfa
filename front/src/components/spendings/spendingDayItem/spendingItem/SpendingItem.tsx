import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faTrashAlt, faFileInvoice } from '@fortawesome/free-solid-svg-icons';
import InvoiceModal from "@components/spendings/invoiceModal/InvoiceModal";
import CategoryComponent from '@components/common/Category';
// import cssSizes from "@src/css-sizes";
import ConfirmDeletePopin from "@components/spendings/common/deleteSpendingPopin";
import type { SpendingListItem } from "@components/spendings/types";

interface SpendingItemProps {
  spending: SpendingListItem;
  editCallback: (spending: SpendingListItem) => void;
  toggleAddSpending: () => void;
  isRecurring?: boolean;
}


const SpendingItem = ({
  spending,
  editCallback,
  toggleAddSpending,
  isRecurring,
}: SpendingItemProps) => {
  const [isHover, setIsHover] = useState(false);
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);

  // const isMobile = window.matchMedia(`(max-width: ${cssSizes.responsiveMaxWidth}px)`).matches;
  const isMobile = false;

  const onMouseOver = () => { !isMobile && setIsHover(true) };
  const onMouseLeave = () => { !isMobile && setIsHover(false) };
  const openEditModal = () => editCallback(spending);
  const spendingLabel = spending.label ?? "";

  const hideConfirm = () => {
    toggleAddSpending();
    setIsDeleteConfirmVisible(false);
    setIsHover(false);
  };

  return (
    <div
      className="flex justify-center cursor-default select-none"
      onMouseOver={onMouseOver}
      onMouseLeave={onMouseLeave}
    >
      {
        isInvoiceModalVisible ?
          <InvoiceModal
            handleClickOutside={() => { !isMobile && setIsHover(false); setIsInvoiceModalVisible(!isInvoiceModalVisible) }}
            spending={spending}
          />
          :
          null
      }
      {
        !isDeleteConfirmVisible ?
          <div className={`flex justify-between w-[460px] rounded-sm ${isHover && "bg-spendingItemHover"} transition-colors ease-linear duration-200 ${!isRecurring && "mx-4"}`}>

            <div className={`flex items-center ${!isRecurring ? "w-1/3" : "w-1/2"} text-sm font-ubuntu whitespace-nowrap overflow-hidden overflow-y-auto`} title={spendingLabel}>
              {spendingLabel.length > 20 ? `${spendingLabel.slice(0,20)}...` : spendingLabel}
            </div>

            {!isRecurring && (
              ("category" in spending && spending?.category) ?
                <div className="flex justify-center items-center w-1/3">
                  <div className="w-3/4">
                    {spending?.category &&
                      <CategoryComponent item={{ category: spending.category ?? null, categoryColor: spending.categoryColor ?? null }} />
                    }
                  </div>
                </div>
                :
                <div className="flex w-1/3"></div>
              )}

            <div className={`flex justify-around items-center ${!isRecurring ? "w-1/6" : "w-1/4"} text-grey1`}>
              <div
                className={`cursor-pointer ${("invoicefile" in spending && spending.invoicefile) ? "text-invoiceImageIsPresent hover:text-invoiceImageIsPresentHover" : "hover:text-spendingActionHover"}`}
                title="display invoice"
                onClick={() => {setIsInvoiceModalVisible(!isInvoiceModalVisible)}}
              >
                <FontAwesomeIcon icon={faFileInvoice} />
              </div>
              <div
                className="cursor-pointer hover:text-spendingActionHover"
                title="edit"
                onClick={() => openEditModal()}
              >
                <FontAwesomeIcon icon={faPencilAlt} />
              </div>
              <div
                className="cursor-pointer hover:text-spendingActionHover"
                title="delete"
                onClick={
                  () => {
                    toggleAddSpending();
                    setIsDeleteConfirmVisible(true);
                  }
                }
              >
                <FontAwesomeIcon icon={faTrashAlt} />
              </div>
            </div>

            <div className={`flex justify-end ${!isRecurring ? "w-1/6" : "w-1/4"} text-sm items-center`}>{Number(spending.amount).toFixed(2)} €</div>

          </div>
          :
          <ConfirmDeletePopin spending={spending} recurringType={Boolean(isRecurring)} hideConfirm={hideConfirm} />
      }
    </div>
  )
}

export default SpendingItem;















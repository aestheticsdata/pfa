import commonTexts from "@components/common/config/text";

const DeleteInvoiceButton = ({ hideConfirm, deleteInvoice }) => {
  return (
    <button
      className="border border-grey1 bg-grey0 px-0.5 rounded-sm hover:bg-grey1 hover:text-white"
      onClick={ () => {
        deleteInvoice();
        hideConfirm();
      }}
    >
      {commonTexts.deletePopin.delete}
    </button>
  );
};

export default DeleteInvoiceButton;

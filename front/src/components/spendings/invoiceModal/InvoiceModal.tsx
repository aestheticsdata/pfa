import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileUpload } from "@fortawesome/free-solid-svg-icons";
import useOnClickOutside from "use-onclickoutside";
import Image from "next/image";
import Button from "@components/common/form/Button";
import useRequestHelper from "@helpers/useRequestHelper";
import { useUserStore } from "@auth/store/userStore";
import InvoiceImageModal from './invoiceImageModal/InvoiceImageModal';
import CategoryComponent from "@components/common/Category";
import texts from "@components/spendings/config/text";
import Spinner from "@components/common/Spinner";
import { QUERY_KEYS } from "@components/spendings/config/constants";
import ConfirmDelete from "@components/common/confirmDelete";
import DeleteInvoiceButton from "@components/spendings/invoiceModal/deleteInvoiceButton";


const InvoiceModal = ({ handleClickOutside, spending }) => {
  const { privateRequest } = useRequestHelper();
  const queryClient = useQueryClient();
  const { invoiceModal: invoiceModalTexts } = texts;
  const user = useUserStore((state) => state.user);
  const userID = user?.id;
  const fileSizeLimit = 32_097_152;
  const [invoicefile, setInvoicefile] = useState<string | File>("");
  const [invoiceImage, setInvoiceImage] = useState(null);
  const [isFileTooBig, setIsFileTooBig] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isClickOnThumbnail, setIsClickOnThumbnail] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [isProgress, setIsProgress] = useState(false);
  const [showConfirmDeleteImage, setShowConfirmDeleteImage] = useState(false);
  const ref = useRef(null);
  const onChange = (e) => { setInvoicefile(e.target.files[0]) };

  const handleClickOutsideCheckFullImage = () => {
    !isClickOnThumbnail && handleClickOutside();
  }

  useOnClickOutside(ref, handleClickOutsideCheckFullImage);

  const confirmDeleteImage = () => {
    setShowConfirmDeleteImage(true);
  }

  const deleteImage = async () => {
    try {
      setIsLoading(true);
      const res = await privateRequest('/spendings/upload', {
        method: 'PUT',
        data: spending,
      })
      if (res?.data?.msg === 'INVOICE_IMAGE_DELETED') {
        setInvoiceImage(null);
        setInvoicefile('');
        await queryClient.invalidateQueries([QUERY_KEYS.SPENDINGS_BY_MONTH]);
        setIsLoading(false);
      }
    } catch (e) {
      console.log('error deleting image : ', e);
    }
  }

  const uploadInvoiceImage = async (payload) => {
    const config = {
      onUploadProgress: (progressEvent) => {
        const progressValue = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgressValue(progressValue);
        if (progressValue === 100) {
          setIsProgress(false);
          setProgressValue(0);
        }
      }
    };
    try {
      setIsProgress(true);
      setIsLoading(true);
      const uploadedImage = await privateRequest('/spendings/upload', {
        method: 'POST',
        data: payload,
      }, config);
      setInvoiceImage(uploadedImage.data);
      await queryClient.invalidateQueries([QUERY_KEYS.SPENDINGS_BY_MONTH]);
      setIsLoading(false);
    } catch (e) {
      console.log('error uploading image : ', e);
    }
  }

  const getInvoiceImage = async (spending) => {
    setIsLoading(true);
    const res = await privateRequest(`/spendings/upload/${spending.ID}?userID=${userID}&itemType=${spending.itemType}`);
    setInvoiceImage(res.data);
    setIsLoading(false);
  }

  useEffect(() => {
    getInvoiceImage(spending);

    // prevent scrolling on body when modal is open
    document.body.style.overflowY = 'hidden';
    return () => {
      document.body.style.overflowY = 'auto';
    }
  }, []);


  const onSubmit = () => {
    setIsFileTooBig(false);
    const formData = new FormData();

    // warning, userID must be appended before file
    // see : https://stackoverflow.com/questions/39589022/node-js-multer-and-req-body-empty
    formData.append('userID', userID);

    switch (spending.itemType) {
      case 'recurring':
        formData.append('itemType', 'recurring');
        formData.append('dateFrom', spending.dateFrom);
        break;
      case 'spending':
        formData.append('itemType', 'spending');
        formData.append('date', spending.date);
        break;
      default:
        break;
    }

    formData.append('label', spending.label);
    formData.append('spendingID', spending.ID);
    formData.append('invoiceImageUpload', invoicefile);

    if ((invoicefile as File).size > fileSizeLimit) {
      setIsFileTooBig(true);
    } else {
      uploadInvoiceImage(formData);
    }
  };

  return (
    <div className="fixed flex justify-center items-center z-50 left-0 right-0 top-0 bottom-0 bg-invoiceFileModalBackground">
      <div
        ref={ref}
        className="absolute w-[500px] h-[420px] bg-grey0 rounded-sm overflow-hidden"
      >
        {
          isClickOnThumbnail ?
            <InvoiceImageModal
              image={invoiceImage}
              closeImage={() => setIsClickOnThumbnail(!isClickOnThumbnail)}
            />
            :
            null
        }
        <div className="flex justify-center items-center space-x-4 py-2 px-1 h-[40px] bg-grey01 border-b-2 border-b-grey1 font-medium">
          <div
            className="cursor-default max-w-[210px] overflow-hidden text-ellipsis whitespace-nowrap"
            title={spending.label}
          >
            {spending.label}
          </div>
          <div className="w-1/4">
            {spending?.category &&
              <CategoryComponent item={spending} />
            }
          </div>
          <div>
            {Number(spending.amount).toFixed(2)} €
          </div>
        </div>
        <div className="flex justify-center items-center h-[250px] border-b-2 border-grey1">
          {
            isLoading ?
              <div className="flex justify-center items-center h-[220px]">
               <Spinner />
              </div>
              :
              invoiceImage ?
                <Image
                  src={invoiceImage}
                  width={300}
                  height={250}
                  alt="invoice"
                  onClick={() => {setIsClickOnThumbnail(!isClickOnThumbnail)}}
                  className="cursor-pointer max-w-full max-h-full object-contain"
                  unoptimized
                />
                :
                <div className="flex justify-center items-center border-2 border-grey1 rounded-sm w-3/4 h-3/4 text-3xl font-extralight">
                  <div className="no-invoice-label">
                    {invoiceModalTexts.noInvoice}
                  </div>
                </div>
          }
        </div>
        <div className="flex justify-center items-center flex-col h-[105px]">
          {
            isFileTooBig && (
              <div className="file-too-big">
                {invoiceModalTexts.fileTooBig}
              </div>
            )
          }
          {
            isLoading ?
              isProgress ?
                <div className="flex flex-col space-y-2 w-[250px]">
                  <div className="relative text-grey2 font-semibold" style={{left: `${progressValue*2.5}px`}}>{progressValue} %</div>
                  <div className="rounded-sm h-2.5 bg-white">
                    <div className="bg-grey1 h-2.5 rounded-sm" style={{width: `${progressValue*2.5}px`}}></div>
                  </div>
                </div>
                :
                <div className="flex justify-center items-center h-[220px]">
                 <Spinner />
                </div>
              :
              invoiceImage ?
                showConfirmDeleteImage ?
                  <ConfirmDelete hideConfirm={() => { setShowConfirmDeleteImage(false) }}>
                    <DeleteInvoiceButton
                      hideConfirm={() => {setShowConfirmDeleteImage(false)}}
                      deleteInvoice={deleteImage}
                    />
                  </ConfirmDelete>
                  :
                  <Button
                    type="button"
                    onClick={confirmDeleteImage}
                    label={invoiceModalTexts.delete}
                  />
                :
                <>
                  <input
                    className="hidden"
                    type="file"
                    id="invoicefileinputid"
                    name="invoicefile"
                    accept="image/jpeg"
                    onChange={onChange}
                  />
                  <div className="flex flex-col mt-6 justify-center items-center h-[105px] w-full bg-grey0">
                    <label htmlFor="invoicefileinputid" className="flex justify-center text-grey2 w-11/12">
                      {
                        invoicefile !== '' ?
                          <div className="flex flex-col space-y-4 pt-2 relative font-semibold text-lg h-[105px]">
                            <div>{(invoicefile as File).name}</div>
                            {
                              invoicefile && (
                                <Button
                                  type="submit"
                                  onClick={onSubmit}
                                  disabled={invoicefile === ''}
                                  label={invoiceModalTexts.send}
                                />
                              )
                            }
                          </div>
                          :
                          <div className="w-[230px]">
                            <div className="flex justify-center items-center">
                              <div className="relative text-6xl hover:cursor-pointer hover:text-addSpendingHover">
                                <FontAwesomeIcon icon={faFileUpload} />
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <div className="flex justify-center font-semibold">
                                {invoiceModalTexts.chooseFile}
                              </div>
                              <div className="flex justify-center text-xxs">
                                {invoiceModalTexts.fileTypeWarning}
                              </div>
                            </div>
                          </div>
                      }
                    </label>
                  </div>
                </>
          }
        </div>
      </div>
    </div>
  )
};

export default InvoiceModal;

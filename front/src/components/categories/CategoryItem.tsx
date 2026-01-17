import { useEffect, useState } from "react";
import Swal from 'sweetalert2';
import Button from "@components/common/form/Button";
import CategoryComponent from "@components/common/Category";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import useCategories from "@components/spendings/services/useCategories";
import categories from "@pages/categories";


const CategoryItem = ({ category }) => {
  const { deleteCategory, updateCategory } = useCategories();
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [singleCategory, setSingleCategory] = useState(category);
  const initialCategory = {...category};
  // const updateError = useSelector(state=>state.categoriesReducer);
  // const updateErrorMessage = useSelector(state => state.categoriesReducer.errorMessage);

  // useEffect(() => {
  //   if (updateErrorMessage !== '' && updateError.ID === category.ID) {
  //     setSingleCategory(initialCategory);
  //     Swal.fire({
  //       title: 'Error',
  //       text: updateErrorMessage.errors[0].message,
  //       confirmButtonText: 'close',
  //     })
  //   }
  // }, [updateError]);

  const deleteCallback = (categoryID) => {
    deleteCategory.mutate({ categoryID });
    setIsDeleteConfirmVisible(false);
  };

  const item = {
    category: singleCategory.name,
    categoryColor: singleCategory.color,
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setSingleCategory(initialCategory);
  }

  const commitEditing = () => {
    setIsEditing(false);
    console.log("singleCategory", singleCategory);
    updateCategory.mutate({ singleCategory });
  }

  const confirmDeletePopin = (item, deleteCallback) => {
    return (
      <div className="flex justify-between items-center bg-warningDeleteBackground p-1 rounded-sm">
        <div className="text-xs text-warningDelete font-bold">
          Confirmer la suppression ?
        </div>
        <div className="flex space-x-2">
          <Button
            type="button"
            label="Annuler"
            fontSize="text-xxs"
            hoverTextColor="hover:text-grey3"
            onClick={() => setIsDeleteConfirmVisible(false)}
          />
          <Button
            type="button"
            label="Effacer"
            fontSize="text-xxs"
            hoverTextColor="hover:text-warningDelete"
            onClick={
              () => {
                setIsDeleteConfirmVisible(false);
                deleteCallback(item.ID);
              }
            }
          />
        </div>
      </div>
    );
  };

  const editCategoryPopin = () => {
    return (
      <div className="flex text-xs space-x-2">

        <input
          type="text"
          className="rounded-sm px-2"
          value={singleCategory.name}
          onChange={(ev) => setSingleCategory({...singleCategory, name: ev.target.value})}
          onKeyPress={(keypressEvent) => { keypressEvent.code === 'Enter' && commitEditing() }}
        />

        <input
          type="color"
          className="rounded-sm bg-transparent cursor-pointer hover:shadow-login"
          value={singleCategory.color}
          onChange={(ev) => setSingleCategory({...singleCategory, color: ev.target.value})}
        />

        <Button
          type="button"
          label="Annuler"
          fontSize="text-xxs"
          hoverTextColor="hover:text-white"
          onClick={() => { cancelEditing() }}
        />

        <Button
          type="button"
          label="Modifier"
          fontSize="text-xxs"
          hoverTextColor="hover:text-white"
          onClick={() => { commitEditing() }}
        />

      </div>
    );
  };

  const actionsFragment = () => (
    <div className="flex w-1/5 justify-around text-grey3">
      <div
        className="cursor-pointer hover:text-grey0"
        onClick={() => {
          setIsEditing(true);
        }}
      >
        <FontAwesomeIcon icon={faPencilAlt} />
      </div>
      <div
        className="cursor-pointer hover:text-grey0 transition-colors ease-linear duration-200"
        onClick={() => { setIsDeleteConfirmVisible(true) }}
      >
        <FontAwesomeIcon icon={faTrashAlt} />
      </div>
    </div>
  );

  const getCategoryContainer = () => {
    if (isDeleteConfirmVisible) return confirmDeletePopin(category, deleteCallback);
    if (isEditing) return editCategoryPopin();
    return (
      <div className="flex justify-between items-center">
        <div className="w-[120px]">
          <CategoryComponent item={item} />
        </div>
        { actionsFragment() }
      </div>
    );
  }

  return (
    <div className="w-[350px] hover:shadow-categories hover:rounded-sm p-1 transition-colors ease-linear duration-100">
      { getCategoryContainer() }
    </div>
  );
};

export default CategoryItem;

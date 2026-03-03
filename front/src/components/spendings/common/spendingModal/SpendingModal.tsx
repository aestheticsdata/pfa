import { useState } from "react";
import { useForm, useController } from "react-hook-form";
import Mexp from "math-expression-evaluator";
import subMonths from "date-fns/subMonths";
import format from 'date-fns/format';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Autocomplete } from "@mui/material";
import { TextField } from "@mui/material";
import Button from "@components/common/form/Button";
import Input from "@components/common/form/Input";
import useCategories from "@components/spendings/services/useCategories";
import { useAuth } from "@auth/context/AuthContext";
import useSpendings from "@components/spendings/services/useSpendings";
import useReccurings from "@components/spendings/services/useReccurings";
import AutocompleteItem from "@components/spendings/common/spendingModal/AutocompleteItem";
import { DATE_FORMAT } from "@components/spendings/config/constants";

const spendingSchema = z.object({
  spendingLabel: z.string().nonempty(),
  spendingAmount: z.string().nonempty(),
  category: z.any(),
});

type SpendingForm = z.infer<typeof spendingSchema>;

type CategoryOption = {
  ID: string | null;
  userID: string | null;
  name: string;
  color: string | null;
};


const SpendingModal = ({
   date,
   closeModal,
   spending,
   recurringType,
   isEditing,
   month,
 }) => {
  const { user } = useAuth();
  const { createSpending, updateSpending } = useSpendings();
  const {
    recurrings,
    createRecurring,
    updateRecurring,
    copyRecurrings,
  } = useReccurings();
  const { categories } = useCategories();


  const initialEmptyCategoryState: CategoryOption = {
    ID: null,
    userID: null,
    name: "",
    color: null
  };
  const initialCategoryState: CategoryOption = spending?.category ?
    {
      ID: spending.categoryID,
      userID: user?.id ?? null,
      name: spending.category,
      color: spending.categoryColor,
    }
    :
    initialEmptyCategoryState;

  const { register, handleSubmit, formState, control } = useForm<SpendingForm>({
    resolver: zodResolver(spendingSchema),
    mode: "onChange",
  });

  const {
    field,
    fieldState,
  } = useController({
    name: "category",
    control,
    rules: { required: true },
    defaultValue: null as unknown as CategoryOption | null,
  });

  const [selectedCategory, setselectedCategory] = useState<CategoryOption>(initialCategoryState);

  const getRandomHexColor = () => {
    let r = Math.floor(Math.random()*255).toString(16);
    let g = Math.floor(Math.random()*255).toString(16);
    let b = Math.floor(Math.random()*255).toString(16);
    r = r.length < 2 ? "0" + r : r;
    g = g.length < 2 ? "0" + g : g;
    b = b.length < 2 ? "0" + b : b;
    return `${r}${g}${b}`;
  };

  const processCategory = (values: SpendingForm): CategoryOption => {
    let tempCategory: CategoryOption;

    if (!values.category) { // it's a category deletion
      tempCategory = {
        ID: null,
        userID: user?.id || null,
        name: "",
        color: null, // if there is a name, it's a new category, else it's a category deletion
      }
    } else if ((!selectedCategory?.name || !selectedCategory) && !!values.category) { // so it's a new category. 1) !selectedCategory?.name: pas de catégorie vers une nouvelle catégorie qui n'existe pas encore. 2) !selectedCategory: on passe d'une catégorie qui existe à une nouvelle catégorie qui n'existe pas encore
      tempCategory = {
        ID: null,
        userID: user?.id || null,
        name: String(values.category),
        color: `#${getRandomHexColor()}` // if there is a name, it's a new category, else it's a category deletion
      }
    } else {
      // changement de catégorie qui existe deja, ou meme categorie inchangee
      tempCategory = selectedCategory;
    }

    return tempCategory;
  }

  const onSubmit = (values: SpendingForm) => {
    if (!user) {
      console.error("User is not available");
      return;
    }

    // https://github.com/bugwheels94/math-expression-evaluator
    const mexp = new Mexp();
    const lexed = mexp.lex(String(values.spendingAmount));
    const postfixed = mexp.toPostfix(lexed);
    const amountEvaluatedExpr = mexp.postfixEval(postfixed);

    const spendingEdited = {
      // this format date is required to avoid inconsistency
      // when axios convert date in POST request
      // see https://github.com/axios/axios/issues/567
      date: date ? format(date, 'yyyy-MM-dd') : null,
      // ///////////////////////////////////////////////////
      label: values.spendingLabel,
      amount: amountEvaluatedExpr,
      category: processCategory(values),
      currency: user.baseCurrency,
      userID: user.id,
      id: spending.ID,
    };

    if (isEditing) {
      if (recurringType) {
        // dispatch(updateRecurring(spendingEdited));
        updateRecurring.mutate(spendingEdited);
      } else {
        updateSpending.mutate(spendingEdited);
      }
    } else {
      if (recurringType) {
        const formattedMonth = {
          start: format(month.start, 'yyyy-MM-dd'),
          end: format(month.end, 'yyyy-MM-dd'),
        };
        createRecurring.mutate({ spendingEdited, formattedMonth });
      } else {
        createSpending.mutate(spendingEdited);
      }
    }

    closeModal();
  };

  const handleAutocompleteChange = (value: CategoryOption | null) => {
    setselectedCategory(value ?? initialEmptyCategoryState);
  }

  return (
    <div className={`
      flex bg-spendingItemHover p-2 rounded-b w-full z-20
      ${recurringType
        ? "md:w-full h-[221px]"
        : "md:w-full h-[306px]"
        }
      absolute top-11`
    }>
      <form className="flex flex-col w-full items-center px-4 pt-2 space-y-2">
        <Input
          placeHolder="label"
          register={register}
          defaultValue={spending.label}
          registerName="spendingLabel"
        />
        <Input
          placeHolder="montant"
          register={register}
          defaultValue={spending.amount}
          registerName="spendingAmount"
        />

        {!recurringType &&
          <Autocomplete
            {...field}
            freeSolo
            isOptionEqualToValue={(option: any, value: any) => {
                return option?.ID === value?.ID;
              }
            }
            autoComplete={true}
            style={{width: "100%"}}
            classes={{
             root: "backgroundColor: yellow"
            }}
            getOptionLabel={(option: any) => (typeof option === "string" ? option : (option?.name ?? ""))}
            options={(categories?.data || []) as any[]}
            renderOption={(props, option: any) => {
              const { name, color } = option;
              return <AutocompleteItem key={name} props={props} color={color!} name={name} />;
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Catégorie"
                inputRef={field.ref}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
            value={selectedCategory}
            onChange={
              (_e, value: any) => {
                handleAutocompleteChange(value as CategoryOption | null);
                return field.onChange(value);
              }
            }
            onInputChange={(_, value) => {value && field.onChange(value)}}
          />
        }

        {
          recurringType && recurrings.length === 0 && (
            <Button
              type="button"
              label="Copier les recurrings du mois précédent"
              onClick={() => {
                if (!user) {
                  console.error("User is not available");
                  return;
                }
                closeModal();
                copyRecurrings.mutate({ userID: user.id, dates: {
                    start: format(month.start, DATE_FORMAT),
                    end: format(month.end, DATE_FORMAT),
                    previousMonthStart: format(subMonths(month.start, 1), DATE_FORMAT),
                    previousMonthEnd: format(subMonths(month.end, 1), DATE_FORMAT),
                  }
                });
              }}
            />
          )
        }

        <div className="flex flex-col space-y-2 w-1/3 pt-2">
          <Button
            type="submit"
            disabled={formState.isSubmitting || !formState.isValid}
            label={isEditing ? "Mettre à jour" : "Créer"}
            fontSize={isEditing ? "text-xxs" : "text-sm"}
            onClick={handleSubmit(onSubmit)}
          />
          <Button
            type="reset"
            value="Reset"
            onClick={() => closeModal()}
            label="annuler"
          />
        </div>
      </form>
    </div>
  )
};

export default SpendingModal;

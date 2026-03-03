import type { FieldValues, Path, UseFormRegister } from "react-hook-form";

interface InputProps<T extends FieldValues> {
  register: UseFormRegister<T>;
  registerName: Path<T>;
  defaultValue?: any;
  placeHolder: string;
}

const Input = <T extends FieldValues>({ register, registerName, defaultValue, placeHolder }: InputProps<T>) => {
  return (
    <input
      autoComplete={registerName === "spendingAmount" ? "off": "on"}
      className="text-inherit py-2 w-full bg-transparent border-b-formsGlobalColor border-b outline-hidden"
      placeholder={placeHolder}
      defaultValue={defaultValue}
      {...register(registerName)}
    />
  );
}

export default Input;

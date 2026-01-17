import type { FieldValue, UseFormRegister } from "react-hook-form";

interface InputProps<T> {
  register: UseFormRegister<T>;
  registerName: string;
  defaultValue?: any;
  placeHolder: string;
}

const Input = ({ register, registerName, defaultValue, placeHolder }: InputProps<FieldValue<any>>) => {
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

import { MouseEventHandler } from "react";

type ButtonType = "button" | "submit" | "reset" | undefined;

interface ButtonProps {
  type: ButtonType;
  value?: string;
  fontSize?: string;
  onClick: MouseEventHandler;
  label: string;
  disabled?: boolean;
  hoverTextColor?: string;
}

const Button = ({
  type,
  value,
  onClick,
  label,
  disabled = false,
  fontSize = "text-sm",
  hoverTextColor = "",
}: ButtonProps) => {
  return (
    <button
      type={type}
      value={value}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${fontSize}
        uppercase
        bg-transparent
        rounded
        border-formsGlobalColor
        border
        px-2
        cursor-pointer
        outline-hidden
        disabled:cursor-not-allowed
        disabled:opacity-50
        disabled:shadow-none
        hover:shadow-login
        ${hoverTextColor}
      `}
    >
      {label}
    </button>
  )
}

export default Button;

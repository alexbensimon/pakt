import classNames from "classnames";
import { ButtonHTMLAttributes, FC, MouseEventHandler, ReactNode } from "react";

interface Props {
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  style?: "primary" | "secondary" | "white";
  children?: ReactNode;
}

export const Button: FC<Props> = ({
  children,
  onClick,
  type = "button",
  style = "primary",
}) => (
  <button
    type={type}
    className={classNames(
      "inline-flex items-center rounded-md border px-4 py-2 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2",
      {
        "border-transparent bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500":
          style === "primary",
        "border-transparent bg-teal-100 text-teal-700 hover:bg-teal-200 focus:ring-teal-500":
          style === "secondary",
        "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus:ring-teal-500":
          style === "white",
      },
    )}
    onClick={onClick}
  >
    {children}
  </button>
);

import classNames from "classnames";
import { FC, RefObject } from "react";

type Props = JSX.IntrinsicElements["input"] & {
  innerRef?: RefObject<HTMLInputElement>;
  invalid?: boolean;
};

export const Input: FC<Props> = ({
  type = "text",
  innerRef,
  invalid,
  ...props
}) => {
  return (
    <input
      {...props}
      type={type}
      ref={innerRef}
      className={classNames(
        "block w-full rounded-md placeholder-gray-400 shadow-sm",
        invalid
          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
          : "border-gray-300 focus:border-teal-500 focus:ring-teal-500",
      )}
    />
  );
};

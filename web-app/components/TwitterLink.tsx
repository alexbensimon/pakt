import classNames from "classnames";
import React, { FC } from "react";
import { FaTwitter } from "react-icons/fa";

interface Props {
  theme?: "light" | "dark";
}

export const TwitterLink: FC<Props> = ({ theme = "light" }) => {
  return (
    <a
      href="https://twitter.com/paktdotme"
      target="_blank"
      rel="noopener noreferrer"
    >
      <FaTwitter
        className={classNames("h-5 w-5", {
          "text-white": theme === "light",
          "text-gray-500": theme === "dark",
        })}
      />
    </a>
  );
};

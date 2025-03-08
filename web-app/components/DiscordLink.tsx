import classNames from "classnames";
import React, { FC } from "react";
import { FaDiscord } from "react-icons/fa";

interface Props {
  theme?: "light" | "dark";
}

export const DiscordLink: FC<Props> = ({ theme = "light" }) => {
  return (
    <a
      href="https://discord.gg/p2EwkZqvbu"
      target="_blank"
      rel="noopener noreferrer"
    >
      <FaDiscord
        className={classNames("h-5 w-5", {
          "text-white": theme === "light",
          "text-gray-500": theme === "dark",
        })}
      />
    </a>
  );
};

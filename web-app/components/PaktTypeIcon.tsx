import classNames from "classnames";
import React, { FC } from "react";
import ReactTooltip from "react-tooltip";
import { PaktType } from "../utils/types";

interface Props {
  type: PaktType;
  buttonMode?: boolean;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

const typeToIcon = {
  [PaktType.STEPS]: "👣",
  [PaktType.ACTIVE]: "💪",
  [PaktType.MEDITATION]: "🧘",
  [PaktType.CUSTOM]: "⚙️",
};

const typeToTitle = {
  [PaktType.STEPS]: "Steps",
  [PaktType.ACTIVE]: "Activity",
  [PaktType.MEDITATION]: "Meditation",
  [PaktType.CUSTOM]: "Custom",
};

export const PaktTypeIcon: FC<Props> = ({
  type,
  onClick,
  buttonMode = false,
  disabled = false,
}) => {
  return buttonMode ? (
    <div className="flex items-center justify-center">
      <div
        data-tip={
          disabled
            ? "You can only have one active pakt of this type at a time."
            : null
        }
        data-for="pakt-type-disabled"
      >
        <button
          type="button"
          className="group flex flex-col items-center"
          onClick={onClick}
          disabled={disabled}
        >
          <div
            className={classNames(
              "flex h-12 w-12 items-center justify-center rounded-full border-2",
              {
                "group-hover:border-teal-500": !disabled,
                "opacity-50": disabled,
              },
            )}
          >
            <span className="text-2xl">{typeToIcon[type]}</span>
          </div>
          <div
            className={classNames("font-medium", {
              "opacity-50": disabled,
            })}
          >
            {typeToTitle[type]}
          </div>
          <ReactTooltip
            id="pakt-type-disabled"
            place="top"
            effect="solid"
            className="w-56"
          />
        </button>
      </div>
    </div>
  ) : (
    <div className="flex items-center space-x-2">
      <span className="text-2xl">{typeToIcon[type]}</span>
      <span className="font-medium">{typeToTitle[type]}</span>
    </div>
  );
};

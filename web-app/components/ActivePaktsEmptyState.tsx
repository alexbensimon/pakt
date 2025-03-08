import React, { FC } from "react";
import { MakeNewPaktButton } from "./MakeNewPaktButton";

interface Props {
  onClickNewPakt: () => void;
}

export const ActivePaktsEmptyState: FC<Props> = ({ onClickNewPakt }) => {
  return (
    <div className="mx-auto max-w-md space-y-5 text-center">
      <div className="mx-auto space-y-1">
        <span className="text-xl">🚀</span>
        <div className="text-base font-medium">No active pakts</div>
        <div className="text-base text-gray-500">
          Get started by making a new pakt.
        </div>
      </div>
      <MakeNewPaktButton onClick={onClickNewPakt} />
    </div>
  );
};

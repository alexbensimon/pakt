import React, { FC } from "react";
import { MdOutlineAddCircleOutline } from "react-icons/md";
import { Button } from "./Button";

interface Props {
  onClick: React.MouseEventHandler<HTMLButtonElement> | undefined;
}

export const MakeNewPaktButton: FC<Props> = ({ onClick }) => {
  return (
    <Button style="primary" onClick={onClick}>
      <span className="flex items-center space-x-1.5">
        <MdOutlineAddCircleOutline className="h-5 w-5" />
        <span>Make new pakt</span>
      </span>
    </Button>
  );
};

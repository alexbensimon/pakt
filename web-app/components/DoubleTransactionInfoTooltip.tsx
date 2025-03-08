import React, { FC } from "react";
import { MdInfoOutline } from "react-icons/md";
import ReactTooltip from "react-tooltip";

export const DoubleTransactionInfoTooltip: FC = () => {
  return (
    <>
      <MdInfoOutline
        className="h-5 w-5"
        data-tip="You may have to confirm 2 transactions: one for the token transfer approval, and another one for the pakt creation."
        data-for="approve-info"
      />
      <ReactTooltip
        id="approve-info"
        place="right"
        effect="solid"
        className="w-56"
      />
    </>
  );
};

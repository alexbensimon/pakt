import { FC } from "react";
import { PaktType, paktTypeToText } from "../utils/types";

interface Props {
  paktType: PaktType;
  fitResult: number;
}

export const LastWeekFitResults: FC<Props> = ({ paktType, fitResult }) => {
  return (
    <div>
      Your daily average for the past week is{" "}
      <span className="font-bold">
        {fitResult} {paktTypeToText[paktType]}
      </span>
    </div>
  );
};

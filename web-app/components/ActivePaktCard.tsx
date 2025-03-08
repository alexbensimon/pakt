import { FC } from "react";
import { useFitResult } from "../hooks/useFitResult";
import {
  getPaktTypeByIndex,
  getTimestampMillis,
  goalByPaktTypeAndLevel,
  PaktStructWithIndex,
} from "../utils/types";
import { Card } from "./Card";
import { PaktDetails } from "./PaktDetails";
import { PaktFinishedAction } from "./PaktFinishedAction";

interface Props {
  pakt: PaktStructWithIndex;
  updated: () => void;
}

export const ActivePaktCard: FC<Props> = ({ pakt, updated }) => {
  const { fitResult } = useFitResult({
    paktType: getPaktType(),
    startTimeMillis: getTimestampMillis(pakt.startTime),
    endTimeMillis: getTimestampMillis(pakt.endTime),
  });

  function getPaktType() {
    return getPaktTypeByIndex(pakt.paktType);
  }

  return (
    <Card>
      <div className="space-y-5">
        <PaktDetails pakt={pakt} fitResult={fitResult} />
        {Date.now() >= getTimestampMillis(pakt.endTime) &&
          fitResult !== null && (
            <PaktFinishedAction
              isPaktSuccess={
                fitResult >= goalByPaktTypeAndLevel[getPaktType()][pakt.level]
              }
              pakt={pakt}
              done={updated}
            />
          )}
      </div>
    </Card>
  );
};

import { FC } from "react";
import { getTimestampMillis, PaktStructWithIndex } from "../utils/types";
import { Card } from "./Card";
import { EndCustomPaktActions } from "./EndCustomPaktActions";
import { PaktDetails } from "./PaktDetails";

interface Props {
  pakt: PaktStructWithIndex;
  updated: () => void;
}

export const ActiveCustomPaktCard: FC<Props> = ({ pakt, updated }) => {
  return (
    <Card>
      <div className="space-y-5">
        <PaktDetails pakt={pakt} />
        {Date.now() >= getTimestampMillis(pakt.endTime) && (
          <EndCustomPaktActions pakt={pakt} done={updated} />
        )}
      </div>
    </Card>
  );
};

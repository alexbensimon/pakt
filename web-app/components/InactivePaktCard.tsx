import { FC } from "react";
import { PaktStruct } from "../utils/types";
import { Card } from "./Card";
import { PaktDetails } from "./PaktDetails";

interface Props {
  pakt: PaktStruct;
}

export const InactivePaktCard: FC<Props> = ({ pakt }) => {
  return (
    <Card>
      <PaktDetails pakt={pakt} />
    </Card>
  );
};

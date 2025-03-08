import { FC } from "react";
import {
  getPaktTypeByIndex,
  PaktStructWithIndex,
  PaktType,
} from "../utils/types";
import { ActiveCustomPaktCard } from "./ActiveCustomPaktCard";
import { ActivePaktCard } from "./ActivePaktCard";

interface Props {
  pakts: PaktStructWithIndex[];
  updated: () => void;
}

export const ActivePaktList: FC<Props> = ({ pakts, updated }) => {
  return (
    <div className="flex flex-col items-center space-y-4">
      {pakts.map((pakt) =>
        getPaktTypeByIndex(pakt.paktType) === PaktType.CUSTOM ? (
          <ActiveCustomPaktCard
            key={pakt.index}
            pakt={pakt}
            updated={updated}
          />
        ) : (
          <ActivePaktCard key={pakt.index} pakt={pakt} updated={updated} />
        ),
      )}
    </div>
  );
};

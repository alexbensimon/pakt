import { FC } from "react";
import { MdClear, MdDone, MdHourglassBottom } from "react-icons/md";
import {
  getPaktTypeByIndex,
  getTimestampMillis,
  goalByPaktTypeAndLevel,
  PaktStruct,
  PaktType,
} from "../utils/types";

interface Props {
  pakt: PaktStruct;
  currentFitResult?: number | null;
}

export const StatusIcon: FC<Props> = ({ pakt, currentFitResult }) => {
  function getPaktGoal() {
    return goalByPaktTypeAndLevel[getPaktTypeByIndex(pakt.paktType)][
      pakt.level
    ];
  }

  function isIconDisplayed() {
    const isActiveEndedWithFitResult =
      pakt.active && currentFitResult !== null && isPaktEnded();

    return isActiveEndedWithFitResult || !pakt.active;
  }

  function isSuccess() {
    const successActive =
      pakt.active &&
      currentFitResult != null &&
      currentFitResult >= getPaktGoal();

    const successInactive = !pakt.active && pakt.success;

    return successActive || successInactive;
  }

  function isPaktEnded() {
    return Date.now() >= getTimestampMillis(pakt.endTime);
  }

  function isGenericIconDisplayed() {
    return (
      pakt.active &&
      isPaktEnded() &&
      (getPaktTypeByIndex(pakt.paktType) === PaktType.CUSTOM ||
        currentFitResult === null)
    );
  }

  if (isGenericIconDisplayed())
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-yellow-800">Pakt ended</span>
        <div className="rounded-full bg-yellow-100 p-2">
          <MdHourglassBottom className="h-5 w-5 text-yellow-800" />
        </div>
      </div>
    );

  return isIconDisplayed() ? (
    <div className="flex items-center gap-2">
      {pakt.active && (
        <>
          {isSuccess() ? (
            <>
              <span className="text-sm font-medium text-green-800">
                Goal reached
              </span>
              <div className="rounded-full bg-green-100 p-2">
                <MdDone className="h-5 w-5 text-green-800" />
              </div>
            </>
          ) : (
            <>
              <span className="text-sm font-medium text-red-800">
                Goal not reached
              </span>
              <div className="rounded-full bg-red-100 p-2">
                <MdClear className="h-5 w-5 text-red-800" />
              </div>
            </>
          )}
        </>
      )}
    </div>
  ) : (
    <></>
  );
};

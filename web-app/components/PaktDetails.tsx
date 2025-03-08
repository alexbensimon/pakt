import { ethers } from "ethers";
import { FC } from "react";
import { usePaktStreak } from "../hooks/usePaktStreak";
import {
  getPaktTypeByIndex,
  getTimestampMillis,
  goalByPaktTypeAndLevel,
  PaktStruct,
  PaktType,
} from "../utils/types";
import { PaktTokenImpact } from "./PaktTokenImpact";
import { PaktTypeIcon } from "./PaktTypeIcon";
import { StatusIcon } from "./StatusIcon";

interface Props {
  pakt: PaktStruct;
  fitResult?: number | null;
}

const goalTextByPaktType = {
  [PaktType.STEPS]: "steps per day on average",
  [PaktType.ACTIVE]: "active minutes per day on average",
  [PaktType.MEDITATION]: "minutes meditating per day on average",
  [PaktType.CUSTOM]: "",
};

export const PaktDetails: FC<Props> = ({ pakt, fitResult = null }) => {
  const { streak } = usePaktStreak({
    startTime: pakt.startTime,
    endTime: pakt.endTime,
  });

  function getPaktType() {
    return getPaktTypeByIndex(pakt.paktType);
  }

  function isPaktSuccess() {
    const paktGoal =
      goalByPaktTypeAndLevel[getPaktTypeByIndex(pakt.paktType)][pakt.level];

    const successActive =
      pakt.active && fitResult != null && fitResult >= paktGoal;

    const successInactive = !pakt.active && pakt.success;

    return successActive || successInactive;
  }

  function showImpactResult() {
    const isPaktEnded = Date.now() >= getTimestampMillis(pakt.endTime);

    const isActiveEndedWithFitResult =
      pakt.active && fitResult !== null && isPaktEnded;

    return isActiveEndedWithFitResult || !pakt.active;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 sm:gap-6">
        <div className="flex items-center space-x-2">
          <PaktTypeIcon type={getPaktType()} />
          {getPaktType() !== PaktType.CUSTOM && (
            <span className="rounded-full border border-gray-300 px-2 text-sm font-semibold">
              <span className="text-xs font-normal">lv.</span> {pakt.level}
            </span>
          )}
          {streak && streak > 1 && (
            <span className="rounded-full border border-gray-300 px-2 text-sm font-semibold">
              {streak}{" "}
              <span className="text-xs font-normal">
                <span className="sm:hidden" title="weeks">
                  w.
                </span>
                <span className="hidden sm:inline">weeks</span>
              </span>
            </span>
          )}
        </div>
        <StatusIcon pakt={pakt} currentFitResult={fitResult} />
      </div>
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <span>🎯</span>
          {getPaktType() === PaktType.CUSTOM ? (
            <span>{pakt.description}</span>
          ) : (
            <span>
              {fitResult != null && (
                <>
                  <span className="font-semibold">{fitResult} </span>
                  <span className="text-sm">with a goal of </span>
                </>
              )}
              <span className="text-sm">
                {goalByPaktTypeAndLevel[getPaktType()][pakt.level]}{" "}
                {goalTextByPaktType[getPaktType()]}
              </span>
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <span>🕰️</span>
          <span>
            <span className="text-sm">from</span>{" "}
            <span className="font-semibold">
              {displayDate(getTimestampMillis(pakt.startTime))}
            </span>{" "}
            <span className="text-sm">to</span>{" "}
            <>
              <span className="font-semibold">
                {displayDate(getTimestampMillis(pakt.endTime))}
              </span>{" "}
              <span className="text-sm">
                at {displayTime(getTimestampMillis(pakt.endTime))}
              </span>
            </>
          </span>
        </div>
        <div className="flex items-center">
          <span className="mr-3">💰</span>
          <span className="flex items-center space-x-2">
            <span>
              <span className="font-semibold">
                {ethers.utils.formatEther(pakt.amount)}
              </span>{" "}
              <span className="text-sm">PAKT</span>
            </span>
            <PaktTokenImpact
              paktType={getPaktType()}
              amount={pakt.amount}
              level={pakt.level}
              showBoth={!showImpactResult()}
              success={isPaktSuccess()}
            />
          </span>
        </div>
      </div>
    </div>
  );
};

function displayDate(millis: number) {
  return new Date(millis).toLocaleDateString();
}

function displayTime(millis: number) {
  return new Date(millis).toLocaleTimeString();
}

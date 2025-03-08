import { BigNumber } from "ethers";
import { useContext, useEffect, useState } from "react";
import {
  GlobalContractData,
  GlobalContractDataContext,
} from "../utils/context";
import { getTimestampMillis } from "../utils/types";

interface Props {
  startTime: BigNumber;
  endTime: BigNumber;
}

export function usePaktStreak({ startTime, endTime }: Props) {
  const { paktDuration } = useContext(
    GlobalContractDataContext,
  ) as GlobalContractData;

  const [streak, setStreak] = useState<number>();

  useEffect(() => {
    const startTimeMillis = getTimestampMillis(startTime);
    const endTimeMillis = getTimestampMillis(endTime);

    setStreak(
      Math.round((endTimeMillis - startTimeMillis) / (paktDuration * 1000)),
    );
  }, [startTime, endTime, paktDuration]);

  return { streak };
}

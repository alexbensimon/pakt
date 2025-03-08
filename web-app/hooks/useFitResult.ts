import { useEffect, useState } from "react";
import { handleError } from "../utils/errors";
import { fetchFitResult, verifyManualInput } from "../utils/googleApis";
import { PaktType } from "../utils/types";
import { useAccessToken } from "./useAccessToken";

interface Props {
  paktType: PaktType;
  startTimeMillis: number | null;
  endTimeMillis: number | null;
}

export function useFitResult({
  paktType,
  startTimeMillis,
  endTimeMillis,
}: Props) {
  const [fitResult, setFitResult] = useState<number | null>(null);

  const { accessToken } = useAccessToken() as { accessToken: string };

  useEffect(() => {
    if (accessToken && startTimeMillis && endTimeMillis) {
      getFitResult();
    }

    async function getFitResult() {
      try {
        const hasManualInputSteps = await verifyManualInput({
          paktType,
          startTimeMillis: startTimeMillis as number,
          endTimeMillis: endTimeMillis as number,
          accessToken,
        });

        if (hasManualInputSteps) {
          return;
        }

        const res = await fetchFitResult({
          paktType,
          startTimeMillis: startTimeMillis as number,
          endTimeMillis: endTimeMillis as number,
          accessToken,
        });
        setFitResult(res);
      } catch (error) {
        handleError(error);
      }
    }
  }, [paktType, accessToken, startTimeMillis, endTimeMillis]);

  return { fitResult };
}

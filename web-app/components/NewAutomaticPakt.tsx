import { FC, useEffect, useState } from "react";
import { useAccessToken } from "../hooks/useAccessToken";
import { useFitResult } from "../hooks/useFitResult";
import {
  goalByPaktTypeAndLevel,
  LoadingStage,
  ONE_DAY_TIME,
  PaktFormType,
  PaktType,
} from "../utils/types";
import { AuthorizeGoogleButton } from "./AuthorizeGoogleButton";
import { LastWeekFitResults } from "./LastWeekFitResults";
import { PaktForm } from "./PaktForm";

interface Props {
  paktType: PaktType;
  makeNewPakt: (form: PaktFormType) => void;
  loadingStage: LoadingStage;
}

export const NewAutomaticPakt: FC<Props> = ({
  paktType,
  makeNewPakt,
  loadingStage,
}) => {
  const { accessToken } = useAccessToken();
  // To prevent rerender as now changes too fast
  const now = Math.round(Date.now() / 5000) * 5000;
  const { fitResult } = useFitResult({
    paktType,
    startTimeMillis: now - 7 * ONE_DAY_TIME,
    endTimeMillis: now,
  });

  const [recommendedLevel, setRecommendedLevel] = useState<number>();

  useEffect(() => {
    if (fitResult === null) return;

    const goals = goalByPaktTypeAndLevel[paktType] as number[];
    const recommendedLevel = goals.findIndex((goal) => goal > fitResult);
    setRecommendedLevel(
      recommendedLevel > 0 ? recommendedLevel : goals.length - 1,
    );
  }, [fitResult, paktType]);

  return (
    <div className="space-y-6">
      {!accessToken ? (
        <div className="space-y-2">
          <div className="text-sm font-medium">
            Sign in to see how you did last week
          </div>
          <AuthorizeGoogleButton />
        </div>
      ) : (
        <LastWeekFitResults paktType={paktType} fitResult={fitResult || 0} />
      )}
      <PaktForm
        paktType={paktType}
        submit={makeNewPakt}
        loadingStage={loadingStage}
        recommendedLevel={recommendedLevel}
      />
    </div>
  );
};

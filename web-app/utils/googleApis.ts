import { hasGrantedAllScopesGoogle, TokenResponse } from "@react-oauth/google";
import toast from "react-hot-toast";
import { ONE_DAY_TIME, PaktType } from "./types";

export const GOOGLE_AUTH_SCOPE =
  "https://www.googleapis.com/auth/fitness.activity.read";

const dataTypeNameByPaktType = {
  [PaktType.STEPS]: "com.google.step_count.delta",
  [PaktType.ACTIVE]: "com.google.active_minutes",
  [PaktType.MEDITATION]: "com.google.activity.segment",
  [PaktType.CUSTOM]: "",
};

const getManualInputDataSourceIdByPaktType = (paktType: PaktType) =>
  `raw:${dataTypeNameByPaktType[paktType]}:com.google.android.apps.fitness:user_input`;

export function verifyGoogleAuthScope(response: TokenResponse) {
  if (hasGrantedAllScopesGoogle(response, GOOGLE_AUTH_SCOPE)) {
    return true;
  } else {
    toast.error(
      "You need to grant read access to your fitness data to use Pakt.",
    );
    return false;
  }
}

export async function verifyGoogleAccountLinked(
  accessToken: string,
  userId: string,
) {
  const rawResponse = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    },
  );
  const content = await rawResponse.json();
  if (content.sub === userId) {
    return true;
  } else {
    toast.error(
      "You need to use the same Google account you linked to this wallet.",
    );
    return false;
  }
}

export async function verifyManualInput({
  paktType,
  startTimeMillis,
  endTimeMillis,
  accessToken,
}: {
  paktType: PaktType;
  startTimeMillis: number;
  endTimeMillis: number;
  accessToken: string;
}) {
  const rawResponse = await fetch(
    "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        aggregateBy: [
          {
            dataSourceId: getManualInputDataSourceIdByPaktType(paktType),
          },
        ],
        startTimeMillis,
        endTimeMillis,
      }),
    },
  );
  const content = await rawResponse.json();
  const hasManualInput = !!content.bucket?.[0]?.dataset?.[0]?.point?.length;
  if (hasManualInput) {
    toast.error(
      "There are some manual input data in your Google Fit. Please, remove them to be able to use Pakt.",
    );
  }
  return hasManualInput;
}

export async function fetchFitResult({
  paktType,
  startTimeMillis,
  endTimeMillis,
  accessToken,
}: {
  paktType: PaktType;
  startTimeMillis: number;
  endTimeMillis: number;
  accessToken: string;
}) {
  const rawResponse = await fetch(
    "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        aggregateBy: [
          {
            dataTypeName: dataTypeNameByPaktType[paktType],
          },
        ],
        bucketByTime: { durationMillis: ONE_DAY_TIME },
        startTimeMillis,
        endTimeMillis,
      }),
    },
  );
  const content = await rawResponse.json();

  let values: number[];
  if (paktType === PaktType.MEDITATION) {
    values = content.bucket.reduce((acc: number[], current: any) => {
      // 45 is the id for meditation
      const point = current.dataset[0].point.find(
        (point: any) => point.value[0].intVal === 45,
      );
      // The value is in ms so to get the time in minutes we need to divide by 60 * 1000
      const value = point ? point.value[1].intVal / (60 * 1000) : 0;
      return [...acc, value];
    }, []);
  } else {
    values = content.bucket.map(
      (bucket: any) => bucket.dataset[0].point[0]?.value[0]?.intVal || 0,
    );
  }

  let result = 0;

  if (values.length) {
    result = values.reduce((a, b) => a + b, 0) / values.length;
  }

  return Math.round(result);
}

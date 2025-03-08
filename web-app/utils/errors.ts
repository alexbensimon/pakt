import * as Sentry from "@sentry/nextjs";

export function handleError(error?: any) {
  const errorMessage: string =
    error?.data?.message || error?.message || "Unknown error";

  const isErrorToIgnore = errorsToIgnore.some((toIgnore) =>
    errorMessage.includes(toIgnore),
  );
  if (isErrorToIgnore) return;

  if (error instanceof Error) {
    Sentry.captureException(error);
  } else {
    const errorToReport =
      error?.data?.message || error?.message || JSON.stringify(error);
    Sentry.captureMessage(errorToReport);
  }
}

const errorsToIgnore = [
  "User rejected the request",
  "underlying network changed",
];

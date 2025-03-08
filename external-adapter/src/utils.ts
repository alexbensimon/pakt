export enum RequestAction {
  LINK_SOURCE_ID = "LINK_SOURCE_ID",
  VERIFY_PAKT = "VERIFY_PAKT",
}

export enum PaktType {
  CUSTOM = "CUSTOM",
  STEPS = "STEPS",
  ACTIVE = "ACTIVE",
  MEDITATION = "MEDITATION",
}

export function getPaktTypeByIndex(index: number) {
  return Object.values(PaktType)[index];
}

export const dataTypeNameByPaktType = {
  [PaktType.CUSTOM]: "",
  [PaktType.STEPS]: "com.google.step_count.delta",
  [PaktType.ACTIVE]: "com.google.active_minutes",
  [PaktType.MEDITATION]: "com.google.activity.segment",
};

export const getManualInputDataSourceIdByPaktType = (paktType: PaktType) =>
  `raw:${dataTypeNameByPaktType[paktType]}:com.google.android.apps.fitness:user_input`;

export const goalByPaktTypeAndLevel = {
  [PaktType.CUSTOM]: "",
  [PaktType.STEPS]: [0, 3_000, 5_000, 7_000, 10_000, 15_000],
  [PaktType.ACTIVE]: [0, 20, 30, 40, 60, 100],
  [PaktType.MEDITATION]: [0, 5, 10, 20, 40, 60],
};

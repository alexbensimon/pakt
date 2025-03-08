import { BigNumber } from "ethers";
import contractInfo from "../contracts/contract-info.json";
import { PaktManager } from "../typechain";

export const ONE_DAY_TIME = 86400000;

export enum LoadingStage {
  NONE = "NONE",
  WAITING_FOR_WALLET = "WAITING_FOR_WALLET",
  LOADING = "LOADING",
}

export type PaktStruct = PaktManager.PaktStructOutput;

export type PaktStructWithIndex = PaktStruct & {
  index: number;
};

export interface PaktFormType {
  level?: number;
  description?: string;
  amountToLock: number;
}

export enum PaktType {
  CUSTOM = "CUSTOM",
  STEPS = "STEPS",
  ACTIVE = "ACTIVE",
  MEDITATION = "MEDITATION",
}

export function getPaktTypeIndex(paktType: PaktType) {
  return Object.values(PaktType).indexOf(paktType);
}

export function getPaktTypeByIndex(index: number) {
  return Object.values(PaktType)[index];
}

export function getTimestampMillis(timestamp: BigNumber) {
  return timestamp.toNumber() * 1000;
}

export const goalByPaktTypeAndLevel = {
  [PaktType.CUSTOM]: "",
  [PaktType.STEPS]: [0, 3_000, 5_000, 7_000, 10_000, 15_000],
  [PaktType.ACTIVE]: [0, 20, 30, 40, 60, 100],
  [PaktType.MEDITATION]: [0, 5, 10, 20, 40, 60],
};

export const paktTypeToText = {
  [PaktType.STEPS]: "steps",
  [PaktType.ACTIVE]: "active minutes",
  [PaktType.MEDITATION]: "minutes meditating",
  [PaktType.CUSTOM]: "",
};

// No confirmations on local chain
export const CONFIRMATIONS = Number(contractInfo.chainId) === 1337 ? 0 : 2;

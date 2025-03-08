import { BigNumber } from "ethers";
import { createContext, Dispatch, SetStateAction } from "react";
import { PaktManager, PaktToken } from "../typechain";

export interface AccessTokenContextType {
  accessToken: string | null;
  setAccessToken: Dispatch<SetStateAction<string | null>>;
}
export const AccessTokenContext = createContext<AccessTokenContextType | null>(
  null,
);

export interface ContractContextType {
  tokenContract: PaktToken;
  managerContract: PaktManager;
}
export const ContractContext = createContext<ContractContextType | null>(null);

export interface GlobalContractData {
  paktDuration: number;
  maxAmountByLevel: number[];
  interestRateByLevel: number[];
  burnInterestRatio: number;
  unlockFundsFee: BigNumber;
}
export const GlobalContractDataContext =
  createContext<GlobalContractData | null>(null);

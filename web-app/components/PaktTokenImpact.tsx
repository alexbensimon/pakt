import { ethers } from "ethers";
import { FC, useContext, useEffect, useState } from "react";
import {
  ContractContext,
  ContractContextType,
  GlobalContractData,
  GlobalContractDataContext,
} from "../utils/context";
import { PaktStruct, PaktType } from "../utils/types";

interface Props {
  paktType: PaktType;
  amount: PaktStruct["amount"];
  level?: number;
  showBoth: boolean;
  success?: boolean;
}

export const PaktTokenImpact: FC<Props> = ({
  paktType,
  amount,
  level,
  showBoth,
  success,
}) => {
  const { burnInterestRatio } = useContext(
    GlobalContractDataContext,
  ) as GlobalContractData;
  const { managerContract } = useContext(
    ContractContext,
  ) as ContractContextType;

  const [gain, setGain] = useState<number>();
  const [loss, setLoss] = useState<number>();

  useEffect(() => {
    let isMounted = true;

    if (paktType === PaktType.CUSTOM) {
      setGain(0);
      setLoss(Number(ethers.utils.formatEther(amount)));
    } else if (level !== undefined) {
      computeImpact();
    }

    async function computeImpact() {
      const interest = await managerContract.computeInterestForAmount(
        amount,
        level as number,
      );
      const gain = Number(ethers.utils.formatEther(interest));

      if (isMounted) {
        setGain(gain);
        setLoss(gain * burnInterestRatio);
      }
    }

    return () => {
      // To avoid memory leak
      isMounted = false;
    };
  }, [amount, level, burnInterestRatio, managerContract, paktType]);

  return (
    <div className="flex items-center space-x-2">
      {(showBoth || success) && (
        <span className="inline-flex items-center space-x-0.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          <span className="font-semibold">+</span> <span>{gain}</span>
        </span>
      )}
      {(showBoth || !success) && (
        <span className="inline-flex items-center space-x-0.5 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
          <span className="font-semibold">-</span> <span>{loss}</span>
        </span>
      )}
    </div>
  );
};

import { ethers } from "ethers";
import { FC, useContext, useState } from "react";
import toast from "react-hot-toast";
import { MdChevronLeft } from "react-icons/md";
import { useAccount } from "wagmi";
import { ContractContext, ContractContextType } from "../utils/context";
import { handleError } from "../utils/errors";
import {
  CONFIRMATIONS,
  getPaktTypeIndex,
  LoadingStage,
  PaktFormType,
  PaktType,
} from "../utils/types";
import { Card } from "./Card";
import { NewAutomaticPakt } from "./NewAutomaticPakt";
import { NewCustomPakt } from "./NewCustomPakt";
import { PaktTypeIcon } from "./PaktTypeIcon";

interface Props {
  activePaktTypes: number[];
  done: () => void;
}

export const NewPakt: FC<Props> = ({ activePaktTypes, done }) => {
  const [paktType, setPaktType] = useState<PaktType | undefined>();
  const [loadingStage, setLoadingStage] = useState(LoadingStage.NONE);
  const { tokenContract, managerContract } = useContext(
    ContractContext,
  ) as ContractContextType;
  const { address } = useAccount() as { address: string };

  function handleClickClear() {
    if (paktType) {
      setPaktType(undefined);
    } else {
      done();
    }
  }

  function isPaktTypeDisabled(paktType: PaktType) {
    return activePaktTypes.includes(getPaktTypeIndex(paktType));
  }

  async function makeNewPakt(paktForm: PaktFormType) {
    setLoadingStage(LoadingStage.WAITING_FOR_WALLET);

    const amountToLock = ethers.utils.parseEther(
      paktForm.amountToLock.toString(),
    );

    try {
      const allowance = await tokenContract.allowance(
        address,
        managerContract.address,
      );

      if (allowance.lt(amountToLock)) {
        const approveTransaction = await tokenContract.approve(
          managerContract.address,
          ethers.constants.MaxUint256,
        );
        await approveTransaction.wait(CONFIRMATIONS);
      }

      const transaction = await managerContract.makeNewPakt(
        getPaktTypeIndex(paktType as PaktType),
        paktForm.level || 0,
        amountToLock,
        paktForm.description || "",
      );

      setLoadingStage(LoadingStage.LOADING);

      await transaction.wait(CONFIRMATIONS);

      toast.success("New pakt created");
    } catch (error) {
      handleError(error);
    } finally {
      done();
    }
  }

  return (
    <Card>
      <div className="pt-7">
        <button
          type="button"
          className="absolute top-2 left-1.5 text-gray-500"
          onClick={handleClickClear}
        >
          <MdChevronLeft className="h-8 w-8" />
        </button>
        {!paktType ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
            {Object.values(PaktType)
              .reverse()
              .map((type) => (
                <PaktTypeIcon
                  key={type}
                  type={type}
                  buttonMode
                  disabled={isPaktTypeDisabled(type)}
                  onClick={() => setPaktType(type)}
                />
              ))}
          </div>
        ) : (
          <div className="space-y-6">
            <PaktTypeIcon
              type={paktType}
              onClick={() => setPaktType(paktType)}
            />
            {paktType === PaktType.CUSTOM ? (
              <NewCustomPakt
                makeNewPakt={makeNewPakt}
                loadingStage={loadingStage}
              />
            ) : (
              <NewAutomaticPakt
                paktType={paktType}
                makeNewPakt={makeNewPakt}
                loadingStage={loadingStage}
              />
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

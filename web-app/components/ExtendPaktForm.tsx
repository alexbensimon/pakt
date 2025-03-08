import * as amplitude from "@amplitude/analytics-browser";
import { ethers } from "ethers";
import React, { FC, useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { MdChevronLeft } from "react-icons/md";
import { useAccount } from "wagmi";
import {
  ContractContext,
  ContractContextType,
  GlobalContractData,
  GlobalContractDataContext,
} from "../utils/context";
import { handleError } from "../utils/errors";
import {
  CONFIRMATIONS,
  getPaktTypeByIndex,
  LoadingStage,
  PaktStructWithIndex,
  PaktType,
} from "../utils/types";
import { Button } from "./Button";
import { DoubleTransactionInfoTooltip } from "./DoubleTransactionInfoTooltip";
import { Input } from "./Input";
import { PaktTokenImpact } from "./PaktTokenImpact";
import { Spinner } from "./Spinner";

interface Props {
  pakt: PaktStructWithIndex;
  cancel: () => void;
  done: () => void;
}

export const ExtendPaktForm: FC<Props> = ({ done, pakt, cancel }) => {
  const { maxAmountByLevel } = useContext(
    GlobalContractDataContext,
  ) as GlobalContractData;
  const { tokenContract, managerContract } = useContext(
    ContractContext,
  ) as ContractContextType;
  const { address } = useAccount() as { address: string };

  const [amountToLock, setAmountToLock] = useState("");
  const [isAmountValid, setIsAmountValid] = useState(false);
  const [loadingStage, setLoadingStage] = useState(LoadingStage.NONE);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleAmountToLockChange: React.ChangeEventHandler<HTMLInputElement> = (
    e,
  ) => {
    const value = e.target.value.replace(",", ".");
    if (isNaN(+value)) return;

    setAmountToLock(value);
  };

  const extendPakt: React.FormEventHandler<HTMLFormElement> = async (e) => {
    // To avoid page reload
    e.preventDefault();

    amplitude.track("Extend pakt form submitted");

    setLoadingStage(LoadingStage.WAITING_FOR_WALLET);

    const amount = ethers.utils.parseEther(amountToLock.toString());

    try {
      const allowance = await tokenContract.allowance(
        address,
        managerContract.address,
      );

      if (allowance.lt(amount)) {
        const approveTransaction = await tokenContract.approve(
          managerContract.address,
          ethers.constants.MaxUint256,
        );
        await approveTransaction.wait(CONFIRMATIONS);
      }

      const transaction = await managerContract.extendPakt(pakt.index, amount);

      setLoadingStage(LoadingStage.LOADING);

      await transaction.wait(CONFIRMATIONS);

      toast.success("Pakt extended");
    } catch (error) {
      handleError(error);
    } finally {
      done();
    }
  };

  useEffect(() => {
    if (amountToLock === "") {
      inputRef.current?.setCustomValidity("");
    } else {
      verifyAmount(Number(amountToLock));
    }

    function verifyAmount(amount: number) {
      const isAmountValid =
        getPaktTypeByIndex(pakt.paktType) === PaktType.CUSTOM
          ? amount > 0
          : amount > 0 && amount <= maxAmountByLevel[pakt.level];

      inputRef.current?.setCustomValidity(
        isAmountValid ? "" : "Invalid amount for this level.",
      );
      setIsAmountValid(isAmountValid);
    }
  }, [amountToLock, maxAmountByLevel, pakt.level, pakt.paktType]);

  return (
    <form onSubmit={extendPakt} className="space-y-4 pt-2">
      <div className="flex items-center space-x-2">
        <button type="button" onClick={cancel}>
          <MdChevronLeft className="h-6 w-6 text-gray-500" />
        </button>
        <div className="font-medium">Extend pakt for one more week</div>
      </div>
      <div className="space-y-2">
        <label
          htmlFor="amountToLockInput"
          className="inline-flex items-center space-x-2"
        >
          <span>
            Amount of PAKT 💰 to add{" "}
            {getPaktTypeByIndex(pakt.paktType) !== PaktType.CUSTOM && (
              <span>(max. {maxAmountByLevel[pakt.level]})</span>
            )}
          </span>
          {amountToLock && isAmountValid && (
            <PaktTokenImpact
              paktType={getPaktTypeByIndex(pakt.paktType)}
              amount={ethers.utils.parseEther(Number(amountToLock).toFixed(2))}
              level={pakt.level}
              showBoth
            />
          )}
        </label>
        <div className="max-w-xs">
          <Input
            inputMode="decimal"
            pattern="^[0-9]*[.,]?[0-9]*$"
            name="amountToLockInput"
            id="amountToLockInput"
            placeholder="100"
            minLength={1}
            required
            onChange={handleAmountToLockChange}
            value={amountToLock}
            innerRef={inputRef}
            invalid={amountToLock !== "" && !isAmountValid}
          />
        </div>
      </div>
      <div>
        {loadingStage === LoadingStage.NONE && (
          <div className="flex items-center space-x-2">
            <Button type="submit">Extend pakt</Button>
            <DoubleTransactionInfoTooltip />
          </div>
        )}
        {loadingStage === LoadingStage.WAITING_FOR_WALLET && (
          <div className="flex items-center space-x-2">
            <Spinner />
            <span className="text-sm font-semibold">Waiting for wallet...</span>
          </div>
        )}
        {loadingStage === LoadingStage.LOADING && (
          <div className="flex items-center space-x-2">
            <Spinner />
            <span className="text-sm font-semibold">Extending pakt...</span>
          </div>
        )}
      </div>
    </form>
  );
};

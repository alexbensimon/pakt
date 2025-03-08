import * as amplitude from "@amplitude/analytics-browser";
import { ethers } from "ethers";
import React, { FC, useContext, useEffect, useRef, useState } from "react";
import {
  GlobalContractData,
  GlobalContractDataContext,
} from "../utils/context";
import { LoadingStage, PaktFormType, PaktType } from "../utils/types";
import { Button } from "./Button";
import { DoubleTransactionInfoTooltip } from "./DoubleTransactionInfoTooltip";
import { ExternalLink } from "./ExternalLink";
import { Input } from "./Input";
import { LevelPicker } from "./LevelPicker";
import { PaktTokenImpact } from "./PaktTokenImpact";
import { Spinner } from "./Spinner";

interface Props {
  paktType: PaktType;
  submit: (form: PaktFormType) => void;
  loadingStage: LoadingStage;
  recommendedLevel?: number;
}

export const PaktForm: FC<Props> = ({
  paktType,
  submit,
  loadingStage,
  recommendedLevel,
}) => {
  const { maxAmountByLevel } = useContext(
    GlobalContractDataContext,
  ) as GlobalContractData;

  const [selectedLevel, setSelectedLevel] = useState<number>();
  const [amountToLock, setAmountToLock] = useState("");
  const [isAmountValid, setIsAmountValid] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (recommendedLevel) setSelectedLevel(recommendedLevel);
  }, [recommendedLevel]);

  const handleAmountToLockChange: React.ChangeEventHandler<HTMLInputElement> = (
    e,
  ) => {
    const value = e.target.value.replace(",", ".");
    if (isNaN(+value)) return;

    setAmountToLock(value);
  };

  const submitForm: React.FormEventHandler<HTMLFormElement> = (e) => {
    // To avoid page reload
    e.preventDefault();

    amplitude.track("Automatic New pakt form submitted");

    submit({
      level: selectedLevel,
      amountToLock: Number(amountToLock),
    });
  };

  useEffect(() => {
    if (amountToLock === "") {
      inputRef.current?.setCustomValidity("");
    } else {
      verifyAmount(Number(amountToLock));
    }

    function verifyAmount(amount: number) {
      if (selectedLevel === undefined) {
        inputRef.current?.setCustomValidity("You need to select a goal.");
      } else {
        const isAmountValid =
          amount > 0 && amount <= maxAmountByLevel[selectedLevel];

        inputRef.current?.setCustomValidity(
          isAmountValid ? "" : "Too high amount for this level.",
        );
        setIsAmountValid(isAmountValid);
      }
    }
  }, [amountToLock, selectedLevel, maxAmountByLevel]);

  return (
    <form onSubmit={submitForm} className="space-y-6">
      {paktType === PaktType.MEDITATION && (
        <div className="text-sm italic">
          You need a meditation app that{" "}
          <ExternalLink href="https://support.google.com/fit/answer/6098255?hl=en&co=GENIE.Platform%3DAndroid&oco=0">
            syncs
          </ExternalLink>{" "}
          with Google Fit to track your time meditating. On iOS, you must enable
          data sharing with Apple Health, which will then sync with Google Fit.
          Calm, Headspace and Petit Bambou are among the most popular apps.
        </div>
      )}
      {paktType === PaktType.ACTIVE && (
        <div className="text-sm italic">
          Active minutes are an estimation of the time you spend moving every
          day. It includes walking and any type of exercise at a moderate pace.
          You most likely need some kind of fitness tracker for this pakt.
        </div>
      )}
      <LevelPicker
        paktType={paktType}
        selectedLevel={selectedLevel}
        setSelectedLevel={setSelectedLevel}
      />
      <div className="space-y-3">
        <label
          htmlFor="amountToLockInput"
          className="inline-flex items-center space-x-2 font-medium"
        >
          <span>Amount of PAKT 💰 to lock</span>
          {amountToLock && isAmountValid && (
            <PaktTokenImpact
              paktType={paktType}
              amount={ethers.utils.parseEther(Number(amountToLock).toFixed(2))}
              level={selectedLevel}
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
            <Button type="submit">Make a pakt</Button>
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
            <span className="text-sm font-semibold">Creating pakt...</span>
          </div>
        )}
      </div>
    </form>
  );
};

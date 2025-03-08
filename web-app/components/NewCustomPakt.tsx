import * as amplitude from "@amplitude/analytics-browser";
import { ethers } from "ethers";
import React, { FC, useState } from "react";
import { LoadingStage, PaktFormType, PaktType } from "../utils/types";
import { Button } from "./Button";
import { DoubleTransactionInfoTooltip } from "./DoubleTransactionInfoTooltip";
import { Input } from "./Input";
import { PaktTokenImpact } from "./PaktTokenImpact";
import { Spinner } from "./Spinner";

interface Props {
  makeNewPakt: (form: PaktFormType) => void;
  loadingStage: LoadingStage;
}

export const NewCustomPakt: FC<Props> = ({ makeNewPakt, loadingStage }) => {
  const [description, setDescription] = useState("");
  const [amountToLock, setAmountToLock] = useState("");

  const handleDescriptionChange: React.ChangeEventHandler<
    HTMLTextAreaElement
  > = (e) => {
    const value = e.target.value;
    setDescription(value);
  };

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

    amplitude.track("Custom New pakt form submitted");

    makeNewPakt({
      description: description.trim(),
      amountToLock: Number(amountToLock),
    });
  };

  return (
    <form onSubmit={submitForm} className="mt-3 space-y-6">
      <div className="text-sm italic">
        Custom pakts are a way to set your own goals. At the end of the pakt,{" "}
        {"you'll"} have to tell if you succeeded or not. As there {"won't"} be
        any verification, you {"can't"} win tokens with custom pakts, but{" "}
        {"it's"} a great way to challenge yourself as long as you are honest
        with the result. Describe as best as you can what you want to achieve
        for next week!
      </div>
      <div className="space-y-3">
        <label htmlFor="descriptionInput" className="font-medium">
          Description
        </label>
        <textarea
          className="block w-full max-w-lg rounded-md border-gray-300 placeholder-gray-400 shadow-sm focus:border-teal-500 focus:ring-teal-500"
          id="descriptionInput"
          name="descriptionInput"
          rows={2}
          required
          placeholder="Do 15 push ups a day"
          onChange={handleDescriptionChange}
          value={description}
        />
      </div>
      <div className="space-y-3">
        <label
          htmlFor="amountToLockInput"
          className="flex items-center space-x-2 font-medium"
        >
          <span>Amount of PAKT 💰 to lock</span>
          {amountToLock && (
            <PaktTokenImpact
              paktType={PaktType.CUSTOM}
              amount={ethers.utils.parseEther(Number(amountToLock).toFixed(2))}
              level={0}
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

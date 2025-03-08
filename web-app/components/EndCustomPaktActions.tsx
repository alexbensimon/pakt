import { FC, useContext, useState } from "react";
import toast from "react-hot-toast";
import { ContractContext, ContractContextType } from "../utils/context";
import { handleError } from "../utils/errors";
import {
  CONFIRMATIONS,
  LoadingStage,
  PaktStructWithIndex,
} from "../utils/types";
import { Button } from "./Button";
import { ExtendPaktForm } from "./ExtendPaktForm";
import { Spinner } from "./Spinner";

interface Props {
  pakt: PaktStructWithIndex;
  done: () => void;
}

export const EndCustomPaktActions: FC<Props> = ({ pakt, done }) => {
  const { managerContract } = useContext(
    ContractContext,
  ) as ContractContextType;
  const [loadingStage, setLoadingStage] = useState(LoadingStage.NONE);
  const [successOptionsDisplayed, setSuccessOptionsDisplayed] = useState(false);
  const [extendFormDisplayed, setExtendFormDisplayed] = useState(false);

  async function endCustomPakt(success: boolean) {
    setLoadingStage(LoadingStage.WAITING_FOR_WALLET);

    try {
      const transaction = await managerContract.endCustomPakt(
        pakt.index,
        success,
      );
      setLoadingStage(LoadingStage.LOADING);
      await transaction.wait(CONFIRMATIONS);

      const message = success ? "Good job!" : "You'll do better next time!";
      toast(`Pakt archived. ${message}`, {
        icon: "🚀",
      });
    } catch (error) {
      handleError(error);
    } finally {
      setLoadingStage(LoadingStage.NONE);
      done();
    }
  }

  if (extendFormDisplayed)
    return (
      <ExtendPaktForm
        pakt={pakt}
        cancel={() => {
          setExtendFormDisplayed(false);
        }}
        done={() => {
          setExtendFormDisplayed(false);
          done();
        }}
      />
    );

  return (
    <>
      {loadingStage === LoadingStage.NONE && (
        <>
          {!successOptionsDisplayed ? (
            <div className="space-y-2">
              <span className="text-sm font-medium">
                Did you reach your goal?
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  style="white"
                  onClick={() => setSuccessOptionsDisplayed(true)}
                >
                  Yes
                </Button>
                <Button style="white" onClick={() => endCustomPakt(false)}>
                  No
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button onClick={() => setExtendFormDisplayed(true)}>
                Extend
              </Button>
              <Button style="white" onClick={() => endCustomPakt(true)}>
                Unlock funds
              </Button>
            </div>
          )}
        </>
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
          <span className="text-sm font-semibold">Ending pakt...</span>
        </div>
      )}
    </>
  );
};

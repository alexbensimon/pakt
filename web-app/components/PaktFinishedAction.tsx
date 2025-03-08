import { useGoogleLogin } from "@react-oauth/google";
import { FC, useContext, useState } from "react";
import toast from "react-hot-toast";
import { MdInfoOutline } from "react-icons/md";
import ReactTooltip from "react-tooltip";
import { useAccount } from "wagmi";
import {
  ContractContext,
  ContractContextType,
  GlobalContractData,
  GlobalContractDataContext,
} from "../utils/context";
import { handleError } from "../utils/errors";
import { GOOGLE_AUTH_SCOPE } from "../utils/googleApis";
import {
  CONFIRMATIONS,
  LoadingStage,
  PaktStructWithIndex,
} from "../utils/types";
import { Button } from "./Button";
import { ExtendPaktForm } from "./ExtendPaktForm";
import { Spinner } from "./Spinner";

const PAKT_VERIFIER_URL = process.env.NEXT_PUBLIC_PAKT_VERIFIER_URL || "";

interface Props {
  isPaktSuccess: boolean;
  pakt: PaktStructWithIndex;
  done: () => void;
}

export const PaktFinishedAction: FC<Props> = ({
  isPaktSuccess,
  pakt,
  done,
}) => {
  const [extendFormDisplayed, setExtendFormDisplayed] = useState(false);
  const [loadingStage, setLoadingStage] = useState(LoadingStage.NONE);
  const { managerContract } = useContext(
    ContractContext,
  ) as ContractContextType;
  const { address } = useAccount() as { address: string };
  const { unlockFundsFee } = useContext(
    GlobalContractDataContext,
  ) as GlobalContractData;

  async function handleUnlockFundsClick() {
    if (pakt.success) {
      await unlockFunds();
    } else {
      verifyPaktAndUnlockFunds();
    }
  }

  const verifyPaktAndUnlockFunds = useGoogleLogin({
    flow: "auth-code",
    scope: GOOGLE_AUTH_SCOPE,
    onError: handleError,
    onSuccess: async (response) => {
      if (!response.code) return;

      setLoadingStage(LoadingStage.WAITING_FOR_WALLET);

      try {
        const rawResponse = await fetch(PAKT_VERIFIER_URL, {
          method: "POST",
          body: JSON.stringify({
            action: "VERIFY_PAKT",
            paktOwner: address,
            paktIndex: pakt.index,
            authCode: response.code,
          }),
        });
        if (rawResponse.status !== 200) {
          toast.error(await rawResponse.text());
          setLoadingStage(LoadingStage.NONE);
          done();
        }

        managerContract.on("PaktVerified", onPaktVerified);
      } catch (error) {
        handleError(error);
        setLoadingStage(LoadingStage.NONE);
        managerContract.off("PaktVerified", onPaktVerified);

        done();
      }

      async function onPaktVerified(paktOwner: string) {
        if (paktOwner !== address) return;

        managerContract.off("PaktVerified", onPaktVerified);

        unlockFunds();
      }
    },
  });

  async function unlockFunds() {
    setLoadingStage(LoadingStage.WAITING_FOR_WALLET);

    try {
      const transaction = await managerContract.unlockFunds(pakt.index, {
        value: unlockFundsFee,
      });
      setLoadingStage(LoadingStage.LOADING);
      await transaction.wait(CONFIRMATIONS);

      toast(
        "You should have received your funds by now! Thanks for using Pakt.",
        {
          icon: "💰",
        },
      );
    } catch (error) {
      handleError(error);
    } finally {
      setLoadingStage(LoadingStage.NONE);
      done();
    }
  }

  async function archivePakt() {
    setLoadingStage(LoadingStage.WAITING_FOR_WALLET);

    try {
      const transaction = await managerContract.failPakt(pakt.index);
      setLoadingStage(LoadingStage.LOADING);
      await transaction.wait(CONFIRMATIONS);

      toast("Pakt archived. You'll do better next time!", {
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
          {isPaktSuccess ? (
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => {
                  setExtendFormDisplayed(true);
                }}
              >
                Extend
              </Button>
              <div className="flex items-center space-x-2">
                <Button style="white" onClick={handleUnlockFundsClick}>
                  Unlock funds
                </Button>
                <MdInfoOutline
                  className="h-5 w-5"
                  data-tip="Pakt takes a small flat fee when you unlock your funds."
                  data-for="unlock-info"
                />
                <ReactTooltip
                  id="unlock-info"
                  place="right"
                  effect="solid"
                  className="w-56"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button style="primary" onClick={archivePakt}>
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
          <span className="text-sm font-semibold">Unlocking funds...</span>
        </div>
      )}
    </>
  );
};

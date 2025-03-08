import { useGoogleLogin } from "@react-oauth/google";
import { FC, useContext, useState } from "react";
import toast from "react-hot-toast";
import { useAccount } from "wagmi";
import { ContractContext, ContractContextType } from "../utils/context";
import { handleError } from "../utils/errors";
import { GOOGLE_AUTH_SCOPE } from "../utils/googleApis";
import { LoadingStage } from "../utils/types";
import { Button } from "./Button";
import { Spinner } from "./Spinner";

const PAKT_VERIFIER_URL = process.env.NEXT_PUBLIC_PAKT_VERIFIER_URL || "";

interface Props {
  done: () => void;
}

export const LinkSourceId: FC<Props> = ({ done }) => {
  const { address } = useAccount() as { address: string };
  const { managerContract } = useContext(
    ContractContext,
  ) as ContractContextType;
  const [loadingStage, setLoadingStage] = useState(LoadingStage.NONE);

  const linkAccount = useGoogleLogin({
    flow: "auth-code",
    scope: GOOGLE_AUTH_SCOPE,
    onError: handleError,
    onSuccess: async (response) => {
      if (!response.code) return;

      setLoadingStage(LoadingStage.LOADING);

      try {
        const rawResponse = await fetch(PAKT_VERIFIER_URL, {
          method: "POST",
          body: JSON.stringify({
            action: "LINK_SOURCE_ID",
            paktOwner: address,
            authCode: response.code,
          }),
        });
        if (rawResponse.status !== 200) {
          toast.error(await rawResponse.text());
          setLoadingStage(LoadingStage.NONE);
          done();
        }

        managerContract.on("WalletAndSourceIdLinked", onWalletLinked);
      } catch (error) {
        handleError(error);
        setLoadingStage(LoadingStage.NONE);
        managerContract.off("WalletAndSourceIdLinked", onWalletLinked);

        done();
      }

      async function onWalletLinked(wallet: string) {
        if (wallet !== address) return;

        managerContract.off("WalletAndSourceIdLinked", onWalletLinked);

        toast.success("Wallet and Google account linked");

        done();
      }
    },
  });

  return (
    <div className="mx-auto max-w-lg space-y-5 text-center">
      <div className="mx-auto space-y-1">
        <span className="text-xl">👋</span>
        <div className="text-base font-medium">Welcome!</div>
        <div className="text-base text-gray-500">
          First, you need to link your Google account with your wallet address.
        </div>
      </div>
      {loadingStage === LoadingStage.NONE && (
        <Button onClick={linkAccount}>Link account</Button>
      )}
      {loadingStage === LoadingStage.LOADING && (
        <div className="inline-flex items-center space-x-2">
          <Spinner />
          <span className="text-sm font-semibold">Linking account...</span>
        </div>
      )}
    </div>
  );
};

import { useGoogleLogin } from "@react-oauth/google";
import { FC, useContext } from "react";
import { FcGoogle } from "react-icons/fc";
import { MdInfoOutline } from "react-icons/md";
import ReactTooltip from "react-tooltip";
import { useAccount } from "wagmi";
import { useAccessToken } from "../hooks/useAccessToken";
import { ContractContext, ContractContextType } from "../utils/context";
import { handleError } from "../utils/errors";
import {
  GOOGLE_AUTH_SCOPE,
  verifyGoogleAccountLinked,
  verifyGoogleAuthScope,
} from "../utils/googleApis";
import { Button } from "./Button";

export const AuthorizeGoogleButton: FC = () => {
  const { storeAccessToken } = useAccessToken();
  const { address } = useAccount() as { address: string };
  const { managerContract } = useContext(
    ContractContext,
  ) as ContractContextType;

  const loginGoogle = useGoogleLogin({
    scope: GOOGLE_AUTH_SCOPE,
    onError: handleError,
    onSuccess: async (response) => {
      const sourceId = await managerContract.s_walletToSourceId(address);
      const isCorrectAccountLinked = await verifyGoogleAccountLinked(
        response.access_token,
        sourceId.toString(),
      );
      if (!isCorrectAccountLinked) return;

      if (!verifyGoogleAuthScope(response)) return;

      storeAccessToken({
        accessToken: response.access_token,
        expiresAt: Date.now() + response.expires_in * 1000,
      });
    },
  });

  return (
    <div className="flex items-center space-x-2">
      <Button style="white" onClick={() => loginGoogle()}>
        <span className="flex items-center space-x-3">
          <FcGoogle className="h-5 w-5" />
          <span>Sign in with Google</span>
        </span>
      </Button>
      <MdInfoOutline
        className="h-5 w-5"
        data-tip="Pakts are verified using data from the Google Fit app."
        data-for="google-fit-info"
      />
      <ReactTooltip
        id="google-fit-info"
        place="right"
        effect="solid"
        className="w-56"
      />
    </div>
  );
};

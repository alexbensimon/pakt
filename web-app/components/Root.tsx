import { ConnectKitButton } from "connectkit";
import { ethers } from "ethers";
import { FC, useEffect, useMemo, useState } from "react";
import { Toaster } from "react-hot-toast";
import { useAccount, useSigner } from "wagmi";
import contractInfo from "../contracts/contract-info.json";
import { PaktManager, PaktToken } from "../typechain";
import { ContractContext } from "../utils/context";
import { Main } from "./Main";
import { PaktTokenBalance } from "./PaktTokenBalance";

export const Root: FC = () => {
  const { isConnected, address } = useAccount();
  const { data: signer } = useSigner();
  const [shouldUpdateBalance, setShouldUpdateBalance] = useState(true);

  useEffect(() => {
    if (address) {
      setShouldUpdateBalance(true);
    }
  }, [address]);

  const tokenContract = useMemo(() => {
    if (!isConnected || !signer) return null;

    return new ethers.Contract(
      contractInfo.contracts.PaktToken.address,
      contractInfo.contracts.PaktToken.abi,
      signer as ethers.Signer,
    ) as PaktToken;
  }, [signer, isConnected]);

  const managerContract = useMemo(() => {
    if (!isConnected || !signer) return null;

    return new ethers.Contract(
      contractInfo.contracts.PaktManager.address,
      contractInfo.contracts.PaktManager.abi,
      signer as ethers.Signer,
    ) as PaktManager;
  }, [signer, isConnected]);

  return (
    <ContractContext.Provider
      value={
        tokenContract && managerContract
          ? { tokenContract, managerContract }
          : null
      }
    >
      <div className="px-4 pt-4 pb-8 md:px-7 md:pt-7 md:pb-14">
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <div className="flex space-x-1.5">
            <span className="self-start font-mono text-xl font-black">
              Pakt
            </span>
            <span className="text-sm font-semibold text-teal-500">beta</span>
          </div>
          <div className="text-right">
            <div className="flex flex-col items-center gap-2 sm:flex-row">
              {isConnected && tokenContract && (
                <PaktTokenBalance
                  shouldUpdate={shouldUpdateBalance}
                  updated={() => setShouldUpdateBalance(false)}
                />
              )}
              <ConnectKitButton />
            </div>
          </div>
        </div>
        {isConnected && managerContract && tokenContract && (
          <Main paktsModified={() => setShouldUpdateBalance(true)} />
        )}
        <Toaster
          toastOptions={{
            style: {
              maxWidth: 500,
            },
          }}
        />
      </div>
    </ContractContext.Provider>
  );
};

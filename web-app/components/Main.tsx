import * as amplitude from "@amplitude/analytics-browser";
import { FC, useCallback, useContext, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useAccessToken } from "../hooks/useAccessToken";
import {
  ContractContext,
  ContractContextType,
  GlobalContractData,
  GlobalContractDataContext,
} from "../utils/context";
import { PaktStruct, PaktStructWithIndex } from "../utils/types";
import { ActivePaktList } from "./ActivePaktList";
import { ActivePaktsEmptyState } from "./ActivePaktsEmptyState";
import { AuthorizeGoogleButton } from "./AuthorizeGoogleButton";
import { InactivePaktList } from "./InactivePaktList";
import { LinkSourceId } from "./LinkSourceId";
import { MakeNewPaktButton } from "./MakeNewPaktButton";
import { NewPakt } from "./NewPakt";

interface PaktsToDisplay {
  active: PaktStructWithIndex[];
  inactive: PaktStructWithIndex[];
}

interface Props {
  paktsModified: () => void;
}

export const Main: FC<Props> = ({ paktsModified }) => {
  // @ts-expect-error TODO: Fix warning? Or use gapi official lib
  window.gapi = {
    client: {
      setToken: () => {
        //
      },
    },
  };

  const [globalContractData, setGlobalContractData] =
    useState<GlobalContractData | null>(null);
  const [needToLinkSourceId, setNeedToLinkSourceId] = useState<boolean>();
  const [newPaktDisplayed, setNewPaktDisplayed] = useState(false);
  const [activePakts, setActivePakts] = useState<PaktStructWithIndex[]>([]);
  const [inactivePakts, setInactivePakts] = useState<PaktStructWithIndex[]>([]);
  const [activePaktTypes, setActivePaktTypes] = useState<number[]>([]);

  const { address } = useAccount() as { address: string };
  const { accessToken } = useAccessToken();
  const { managerContract } = useContext(
    ContractContext,
  ) as ContractContextType;

  const checkNeedToLinkSourceId = useCallback(async () => {
    const sourceId = await managerContract.s_walletToSourceId(address);
    setNeedToLinkSourceId(sourceId.toString() === "0");
  }, [managerContract, address]);

  useEffect(() => {
    checkNeedToLinkSourceId();
  }, [checkNeedToLinkSourceId]);

  const fetchPakts = useCallback(async () => {
    const pakts: PaktStruct[] = await managerContract.getAllPaktsFromUser(
      address,
    );

    const paktsToDisplay = pakts.reduce(
      (acc: PaktsToDisplay, pakt, i) => {
        const paktWithIndex = { ...pakt, index: i };

        const next = paktWithIndex.active
          ? {
              active: [paktWithIndex, ...acc.active],
            }
          : {
              inactive: [paktWithIndex, ...acc.inactive],
            };

        return {
          ...acc,
          ...next,
        } as PaktsToDisplay;
      },
      { active: [], inactive: [] },
    );

    setActivePakts(paktsToDisplay.active);
    setInactivePakts(paktsToDisplay.inactive);

    const activePaktTypes = paktsToDisplay.active
      .map((pakt) => pakt.paktType)
      .filter((type) => type !== 0);
    setActivePaktTypes(activePaktTypes);
  }, [managerContract, address]);

  useEffect(() => {
    fetchPakts();
  }, [fetchPakts]);

  async function paktCreated() {
    paktsModified();
    await fetchPakts();
    setNewPaktDisplayed(false);
  }

  async function paktUpdated() {
    paktsModified();
    await fetchPakts();
  }

  useEffect(() => {
    getGlobalContractData();
    async function getGlobalContractData() {
      const [
        paktDuration,
        maxAmountByLevel,
        interestRateByLevel,
        burnInterestRatio,
        unlockFundsFee,
      ] = await Promise.all([
        managerContract.PAKT_DURATION(),
        managerContract.getMaxAmountByLevel(),
        managerContract.getInterestRateByLevel(),
        managerContract.s_burnInterestRatio(),
        managerContract.s_unlockFundsFee(),
      ]);

      setGlobalContractData({
        paktDuration,
        maxAmountByLevel,
        interestRateByLevel,
        burnInterestRatio,
        unlockFundsFee,
      });
    }
  }, [managerContract]);

  function handleMakeNewPaktClick() {
    setNewPaktDisplayed(true);

    amplitude.track("New Pakt button clicked");
  }

  return (
    <>
      {globalContractData && (
        <GlobalContractDataContext.Provider value={globalContractData}>
          <div className="mx-auto mt-5 max-w-2xl space-y-2 sm:mt-10">
            {needToLinkSourceId ? (
              <LinkSourceId done={checkNeedToLinkSourceId} />
            ) : newPaktDisplayed ? (
              <NewPakt done={paktCreated} activePaktTypes={activePaktTypes} />
            ) : (
              <div className="space-y-8">
                <div className="space-y-4">
                  {activePakts.length > 0 && (
                    <div className="flex w-full flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
                      <div className="flex flex-col items-center gap-3 sm:flex-row">
                        <div className="text-lg font-semibold">
                          Active pakts
                        </div>
                        {!accessToken && <AuthorizeGoogleButton />}
                      </div>
                      <MakeNewPaktButton onClick={handleMakeNewPaktClick} />
                    </div>
                  )}
                  {activePakts.length > 0 ? (
                    <ActivePaktList pakts={activePakts} updated={paktUpdated} />
                  ) : (
                    <ActivePaktsEmptyState
                      onClickNewPakt={handleMakeNewPaktClick}
                    />
                  )}
                </div>
                {inactivePakts.length > 0 && (
                  <InactivePaktList pakts={inactivePakts} />
                )}
              </div>
            )}
          </div>
        </GlobalContractDataContext.Provider>
      )}
    </>
  );
};

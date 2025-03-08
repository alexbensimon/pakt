import classNames from "classnames";
import { ethers } from "ethers";
import { FC, useContext, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ContractContext, ContractContextType } from "../utils/context";
import { Button } from "./Button";

interface Props {
  shouldUpdate: boolean;
  updated: () => void;
}

export const PaktTokenBalance: FC<Props> = ({ shouldUpdate, updated }) => {
  const { address } = useAccount() as { address: string };
  const { tokenContract } = useContext(ContractContext) as ContractContextType;

  const [balance, setBalance] = useState("0");
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (shouldUpdate) getBalance();

    async function getBalance() {
      const balance = await tokenContract.balanceOf(address);
      setBalance(Number(ethers.utils.formatEther(balance)).toFixed(2));
      updated();
    }
  }, [address, tokenContract, shouldUpdate, updated]);

  function hasNoPakt() {
    return Number(balance) === 0;
  }

  function enter() {
    setHovered(true);
  }

  function leave() {
    setHovered(false);
  }

  function openLink() {
    if (hovered || hasNoPakt()) {
      window
        .open(
          "https://app.uniswap.org/#/swap?outputCurrency=0x9A6A527daeb7439dd00FcAe70d7C6aAD5A9777a3",
          "_blank",
        )
        ?.focus();
    }
  }

  return (
    <span onMouseEnter={enter} onMouseLeave={leave}>
      <Button style={hasNoPakt() ? "primary" : "white"} onClick={openLink}>
        <span
          className={classNames({
            "w-40": !hasNoPakt(),
          })}
        >
          {hovered || hasNoPakt() ? (
            <>Buy PAKT</>
          ) : (
            <>
              <span className="font-semibold">{balance}</span>{" "}
              <span className="text-sm">PAKT 💰</span>
            </>
          )}
        </span>
      </Button>
    </span>
  );
};

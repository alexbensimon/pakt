import { RadioGroup } from "@headlessui/react";
import classNames from "classnames";
import React, { FC, useContext, useEffect, useState } from "react";
import {
  ContractContext,
  ContractContextType,
  GlobalContractData,
  GlobalContractDataContext,
} from "../utils/context";
import {
  goalByPaktTypeAndLevel,
  PaktType,
  paktTypeToText,
} from "../utils/types";

interface Props {
  paktType: PaktType;
  selectedLevel?: number;
  setSelectedLevel: React.Dispatch<React.SetStateAction<number | undefined>>;
}

interface Level {
  id: number;
  title: string;
  goal: number;
  maxAmount: number;
  interestRate: number;
}

export const LevelPicker: FC<Props> = ({
  paktType,
  selectedLevel,
  setSelectedLevel,
}) => {
  const { managerContract } = useContext(
    ContractContext,
  ) as ContractContextType;
  const { maxAmountByLevel, interestRateByLevel } = useContext(
    GlobalContractDataContext,
  ) as GlobalContractData;

  const [levels, setLevels] = useState<Level[]>([]);

  useEffect(() => {
    initLevels();

    async function initLevels() {
      const levels: Level[] = [1, 2, 3, 4, 5].map((level) => ({
        id: level,
        title: `Level ${level}`,
        goal: goalByPaktTypeAndLevel[paktType][level] as number,
        maxAmount: maxAmountByLevel[level] as number,
        interestRate: interestRateByLevel[level] as number,
      }));
      setLevels(levels);
    }
  }, [managerContract, paktType, maxAmountByLevel, interestRateByLevel]);

  return (
    <RadioGroup
      value={selectedLevel || 0}
      onChange={setSelectedLevel}
      className="space-y-4"
    >
      <RadioGroup.Label className="font-medium">
        Select an average daily goal for next week
      </RadioGroup.Label>
      <div className="space-y-3">
        {levels.map((level) => (
          <RadioGroup.Option
            key={level.id}
            value={level.id}
            className={({ checked, active }) =>
              classNames(
                "relative block cursor-pointer rounded-lg border bg-white px-6 py-4 shadow-sm focus:outline-none sm:flex sm:justify-between",
                {
                  "border-transparent": checked,
                  "border-gray-300": !checked,
                  "border-teal-500 ring-2 ring-teal-500": active,
                },
              )
            }
          >
            {({ active, checked }) => (
              <>
                <span className="flex items-center">
                  <span className="flex flex-col text-sm">
                    <RadioGroup.Label as="span" className="font-medium">
                      {level.title}
                    </RadioGroup.Label>
                    <RadioGroup.Description as="span" className="">
                      <span className="block sm:inline">
                        🎯 <span className="font-semibold">{level.goal}</span>{" "}
                        {paktTypeToText[paktType]}
                      </span>
                    </RadioGroup.Description>
                  </span>
                </span>
                <RadioGroup.Description
                  as="span"
                  className="mt-2 flex flex-col text-sm sm:text-right"
                >
                  <span>
                    <span className="text-xs">max. </span>
                    <span className="font-semibold">{level.maxAmount} </span>
                    <span className="text-xs">PAKT to lock</span>
                  </span>
                  <span className="">{level.interestRate / 10} % 💰</span>
                </RadioGroup.Description>
                <span
                  className={classNames(
                    active ? "border" : "border-2",
                    checked ? "border-teal-500" : "border-transparent",
                    "pointer-events-none absolute -inset-px rounded-lg",
                  )}
                  aria-hidden="true"
                />
              </>
            )}
          </RadioGroup.Option>
        ))}
      </div>
    </RadioGroup>
  );
};

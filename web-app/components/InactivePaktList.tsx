import { Transition } from "@headlessui/react";
import React, { FC, useState } from "react";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import { PaktStruct } from "../utils/types";
import { InactivePaktCard } from "./InactivePaktCard";

interface Props {
  pakts: PaktStruct[];
}

export const InactivePaktList: FC<Props> = ({ pakts }) => {
  const [listDisplayed, setListDisplayed] = useState(false);

  function toggleListDisplayed() {
    setListDisplayed((isDisplayed) => !isDisplayed);
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        className="flex items-center space-x-1 text-lg font-semibold"
        onClick={toggleListDisplayed}
      >
        <span>Archive</span>
        {listDisplayed ? (
          <MdKeyboardArrowDown className="h-6 w-6" />
        ) : (
          <MdKeyboardArrowUp className="h-6 w-6" />
        )}
      </button>
      <Transition
        show={listDisplayed}
        enter="transition-opacity duration-75"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="flex flex-col items-center space-y-4">
          {pakts.map((pakt, i) => (
            <InactivePaktCard key={i} pakt={pakt} />
          ))}
        </div>
      </Transition>
    </div>
  );
};

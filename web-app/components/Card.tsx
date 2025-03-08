import { FC, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

export const Card: FC<Props> = ({ children }) => {
  return (
    <div className="relative w-full rounded-lg border border-gray-200 bg-white p-5 shadow md:p-7">
      {children}
    </div>
  );
};

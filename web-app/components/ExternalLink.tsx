import { FC, ReactNode } from "react";

interface Props {
  href: string;
  children?: ReactNode;
}

export const ExternalLink: FC<Props> = ({ href, children }) => {
  return (
    <a
      href={href}
      className="underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
};

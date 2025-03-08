import type { NextPage } from "next";
import Link from "next/link";

const Privacy: NextPage = () => {
  return (
    <>
      <div className="p-4 md:p-7">
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <Link href="/">
            <span className="font-mono text-xl font-black">Pakt</span>
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-10 pb-10">
        <h1 className="mb-6 text-3xl font-semibold">Privacy policy</h1>
        <div className="space-y-4">
          <p>
            When you use Pakt, the information of the pakts you make is stored
            on the blockchain and linked to the wallet you use. All the data on
            the blockchain is public so anyone can see it, but Pakt {"doesn't"}{" "}
            store any information that can be directly linked to your identity.
          </p>
          <p>
            Custom pakts are validated by the person who made the pakt and are
            based on trust. They {"don't"} use any third party data.
          </p>
          <p>
            For the other pakts such as the meditation pakt, you have to give
            the authorization to Pakt to read some fitness data from your Google
            account. Pakt uses this data to help you pick the right goal, and at
            the end of the challenge, to verify if {"it's"} a success. Pakt{" "}
            {"doesn't"} store anything on a private database.
          </p>
          <p>
            The only information stored on the blockchain are the pakts you make
            and if you succeed. This information is linked to your crypto wallet
            and not to your real identity.
          </p>
        </div>
      </div>
    </>
  );
};

export default Privacy;

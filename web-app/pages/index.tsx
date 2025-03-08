import { initializeApp } from "firebase/app";
import { doc, Firestore, getFirestore, setDoc } from "firebase/firestore";
import { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DiscordLink } from "../components/DiscordLink";
import { ExternalLink } from "../components/ExternalLink";
import { TwitterLink } from "../components/TwitterLink";
import appstoreImg from "../img/appstore.svg";
import dashboardImg from "../img/dashboard.png";
import googlefitImg from "../img/googlefit.png";
import levelsImg from "../img/levels.png";
import playstoreImg from "../img/playstore.svg";

const firebaseConfig = {
  apiKey: "AIzaSyCu0Bv9uIdCzA3jQni46zFXh24mq52mSPk",
  authDomain: "pakt-344213.firebaseapp.com",
  projectId: "pakt-344213",
  storageBucket: "pakt-344213.appspot.com",
  messagingSenderId: "278309583530",
  appId: "1:278309583530:web:5ed7f8b5d62a97e32f6ed3",
  measurementId: "G-DZZ0W0K988",
};

const paktTypes = [
  {
    title: "Meditation",
    icon: "🧘",
    description: "Relax. Process your emotions. Improve your focus.",
  },
  {
    title: "Activity",
    icon: "💪",
    description: "Take care of your body.",
  },
  {
    title: "Steps",
    icon: "👣",
    description: "Spend more time outside.",
  },
  {
    title: "Custom",
    icon: "⚙️",
    description: "Choose any goal you want to achieve.",
  },
];

const headerNavigation = [
  {
    name: "Why",
    href: "https://medium.com/@alexandrebensimon/77d9c89c4e16",
  },
  {
    name: "Docs",
    href: "https://docs.pakt.me/",
  },
];

const footerNavigation = {
  main: [{ name: "Privacy policy", href: "/privacy" }],
};

const Root: NextPage = () => {
  const [firestore, setFirestore] = useState<Firestore>();
  const [emailAdded, setEmailAdded] = useState(false);
  const [inputEmail, setInputEmail] = useState("");

  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const firestore = getFirestore(app);
    setFirestore(firestore);
  }, []);

  const addEmail: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!firestore) return;
    await setDoc(doc(firestore, "emails", inputEmail), {});
    setEmailAdded(true);
  };

  return (
    <>
      <Head>
        <title>Home | Pakt</title>
      </Head>
      <div className="bg-white">
        <div className="relative overflow-hidden">
          <div className="bg-gray-900 bg-[url('../img/cogs.svg')]">
            {/* Header */}
            <div className="pt-6">
              <nav
                className="relative mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6"
                aria-label="Global"
              >
                <div className="flex flex-1 items-center">
                  <div className="flex w-auto items-center justify-between">
                    <Link href="/">
                      <span className="font-mono text-2xl font-black text-white md:text-3xl">
                        Pakt
                      </span>
                    </Link>
                  </div>
                  <div className="ml-5 flex flex-col gap-4 sm:flex-row">
                    <div className="flex space-x-3 sm:ml-10 sm:space-x-8">
                      {headerNavigation.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          className="text-base font-medium text-white hover:text-gray-300"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.name}
                        </a>
                      ))}
                    </div>
                    <div className="flex items-center justify-center space-x-6 sm:ml-10">
                      <TwitterLink />
                      <DiscordLink />
                    </div>
                  </div>
                </div>
                <div className="flex md:items-center md:space-x-6">
                  <Link href="/app" target="_blank" rel="noopener noreferrer">
                    <span className="block w-full rounded-md bg-gradient-to-r from-teal-500 to-cyan-600 py-3 px-4 font-medium text-white shadow hover:from-teal-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900">
                      Launch app
                    </span>
                  </Link>
                </div>
              </nav>
            </div>

            {/* First section with catch phrase */}
            <div className="pt-10 pb-20 lg:pt-20 lg:pb-36">
              <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
                  <span className="block">Build better habits</span>
                  <span className="block bg-gradient-to-r from-teal-200 to-cyan-400 bg-clip-text pb-3 text-transparent">
                    with financial incentives
                  </span>
                </h1>
                <p className="text-base text-gray-300 sm:text-lg md:text-xl">
                  Pick a goal. Bet crypto tokens on your success. <br /> Stay
                  consistent and challenge yourself to earn more tokens.
                </p>
                <form
                  onSubmit={addEmail}
                  className="mx-auto mt-8 max-w-xl sm:mt-16"
                >
                  <div className="sm:flex">
                    <div className="min-w-0 flex-1">
                      <label htmlFor="email" className="sr-only">
                        Email address
                      </label>
                      <input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className="block w-full rounded-md border-0 px-4 py-3 text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                        value={inputEmail}
                        onChange={(e) => setInputEmail(e.target.value)}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-center sm:mt-0 sm:ml-3">
                      {emailAdded ? (
                        <span className="text-2xl">🚀</span>
                      ) : (
                        <button
                          type="submit"
                          className="block w-full rounded-md bg-gradient-to-r from-teal-500 to-cyan-600 py-3 px-4 font-medium text-white shadow hover:from-teal-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                        >
                          Notify me
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="overflow-hidden bg-gray-50 py-16 lg:py-24">
            <div className="relative mx-auto max-w-xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
              <svg
                className="absolute left-full hidden -translate-x-1/2 -translate-y-1/4 transform lg:block"
                width={404}
                height={784}
                fill="none"
                viewBox="0 0 404 784"
                aria-hidden="true"
              >
                <defs>
                  <pattern
                    id="b1e6e422-73f8-40a6-b5d9-c8586e37e0e7"
                    x={0}
                    y={0}
                    width={20}
                    height={20}
                    patternUnits="userSpaceOnUse"
                  >
                    <rect
                      x={0}
                      y={0}
                      width={4}
                      height={4}
                      className="text-gray-200"
                      fill="currentColor"
                    />
                  </pattern>
                </defs>
                <rect
                  width={404}
                  height={784}
                  fill="url(#b1e6e422-73f8-40a6-b5d9-c8586e37e0e7)"
                />
              </svg>

              <div className="relative lg:grid lg:grid-cols-2 lg:items-center lg:gap-8">
                <div className="relative">
                  <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                    Earn more with harder challenges
                  </h2>
                  <p className="mt-3 text-lg text-gray-500">
                    Lock PAKT tokens for each challenge. The harder the goal,
                    the bigger the reward if you succeed! If you {"don't"} reach
                    your goal, {"you'll"} lose some tokens.
                  </p>

                  <div className="mt-5 space-x-4">
                    <a
                      href="https://app.uniswap.org/#/swap?outputCurrency=0x9A6A527daeb7439dd00FcAe70d7C6aAD5A9777a3"
                      target="_blank"
                      rel="noopener noreferrer"
                      className=" inline-block rounded-md bg-gradient-to-r from-teal-500 to-cyan-600 py-3 px-4 font-medium text-white shadow hover:from-teal-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                    >
                      Buy PAKT token
                    </a>
                  </div>
                </div>

                <div
                  className="relative -mx-4 mt-10 lg:mt-0"
                  aria-hidden="true"
                >
                  <svg
                    className="absolute left-1/2 -translate-x-1/2 translate-y-16 transform lg:hidden"
                    width={784}
                    height={404}
                    fill="none"
                    viewBox="0 0 784 404"
                  >
                    <defs>
                      <pattern
                        id="ca9667ae-9f92-4be7-abcb-9e3d727f2941"
                        x={0}
                        y={0}
                        width={20}
                        height={20}
                        patternUnits="userSpaceOnUse"
                      >
                        <rect
                          x={0}
                          y={0}
                          width={4}
                          height={4}
                          className="text-gray-200"
                          fill="currentColor"
                        />
                      </pattern>
                    </defs>
                    <rect
                      width={784}
                      height={404}
                      fill="url(#ca9667ae-9f92-4be7-abcb-9e3d727f2941)"
                    />
                  </svg>
                  <div className="relative mx-4 max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
                    <Image src={levelsImg} alt="Screenshot with level picker" />
                  </div>
                </div>
              </div>

              <svg
                className="absolute right-full -bottom-20 hidden translate-x-1/2 translate-y-12 transform lg:block"
                width={404}
                height={784}
                fill="none"
                viewBox="0 0 404 784"
                aria-hidden="true"
              >
                <defs>
                  <pattern
                    id="64e643ad-2176-4f86-b3d7-f2c5da3b6a6d"
                    x={0}
                    y={0}
                    width={20}
                    height={20}
                    patternUnits="userSpaceOnUse"
                  >
                    <rect
                      x={0}
                      y={0}
                      width={4}
                      height={4}
                      className="text-gray-200"
                      fill="currentColor"
                    />
                  </pattern>
                </defs>
                <rect
                  width={404}
                  height={784}
                  fill="url(#64e643ad-2176-4f86-b3d7-f2c5da3b6a6d)"
                />
              </svg>

              <div className="relative mt-12 sm:mt-16 lg:mt-24">
                <div className="lg:grid lg:grid-flow-row-dense lg:grid-cols-2 lg:items-center lg:gap-x-16">
                  <div className="lg:col-start-2">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                      Everything on one dashboard
                    </h2>
                    <p className="mt-3 text-lg text-gray-500">
                      Follow and improve multiple habits at the same time.
                      Update your goals every week. Keep track of your history.
                    </p>

                    <div className="mt-10 space-y-10">
                      {paktTypes.map((paktType) => (
                        <div key={paktType.title} className="flex space-x-6">
                          <div className="text-3xl">{paktType.icon}</div>
                          <div>
                            <p className="text-lg font-medium leading-6 text-gray-900">
                              {paktType.title}
                            </p>
                            <div className="mt-2 text-base text-gray-500">
                              {paktType.description}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative -mx-4 mt-10 lg:col-start-1 lg:mt-0">
                    <svg
                      className="absolute left-1/2 -translate-x-1/2 translate-y-16 transform lg:hidden"
                      width={784}
                      height={404}
                      fill="none"
                      viewBox="0 0 784 404"
                      aria-hidden="true"
                    >
                      <defs>
                        <pattern
                          id="e80155a9-dfde-425a-b5ea-1f6fadd20131"
                          x={0}
                          y={0}
                          width={20}
                          height={20}
                          patternUnits="userSpaceOnUse"
                        >
                          <rect
                            x={0}
                            y={0}
                            width={4}
                            height={4}
                            className="text-gray-200"
                            fill="currentColor"
                          />
                        </pattern>
                      </defs>
                      <rect
                        width={784}
                        height={404}
                        fill="url(#e80155a9-dfde-425a-b5ea-1f6fadd20131)"
                      />
                    </svg>
                    <div className="relative mx-4 max-w-xl overflow-hidden rounded-xl bg-slate-100 shadow-xl">
                      <Image
                        src={dashboardImg}
                        alt="Screenshot with active pakts"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature section verification sync */}
          <div className="relative bg-white py-10 sm:py-12 lg:py-20">
            <div className="mx-auto max-w-md px-4 text-center sm:max-w-3xl sm:px-6 lg:max-w-7xl lg:px-8">
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Automatic verification
              </h2>
              <p className="mx-auto mt-5 max-w-prose text-xl text-gray-500">
                Sync your favorite lifestyle apps with Google Fit. Pakt will
                check data from your Google account to verify if you reach your
                goals.
              </p>
            </div>
            <div className="px-4">
              <div className="mx-auto mt-8 w-20">
                <Image src={googlefitImg} alt="Google Fit icon" />
              </div>
              <div className="mt-3 flex justify-center gap-4">
                <ExternalLink href="https://play.google.com/store/apps/details?id=com.google.android.apps.fitness">
                  <Image src={playstoreImg} alt="Get it on Google Play" />
                </ExternalLink>
                <ExternalLink href="https://apps.apple.com/app/google-fit-activity-tracker/id1433864494">
                  <Image src={appstoreImg} alt="Download on the App Store" />
                </ExternalLink>
              </div>
            </div>
          </div>

          {/* Email form */}
          <div className="bg-gray-900 bg-[url('../img/cogs.svg')] ">
            <div className="mx-auto max-w-7xl py-12 px-4 sm:px-6 lg:flex lg:items-center lg:py-16 lg:px-8">
              <div className="lg:w-0 lg:flex-1">
                <h2
                  className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
                  id="newsletter-headline"
                >
                  Stay up to date
                </h2>
                <p className="mt-3 max-w-3xl text-lg leading-6 text-gray-300">
                  Enter your email if you want to be notified about news on the
                  Pakt project. We will also keep you updated on the rest of the
                  roadmap.
                </p>
              </div>
              <div className="mt-8 sm:w-[434px] lg:mt-0 lg:ml-8">
                <form onSubmit={addEmail} className="sm:flex">
                  <label htmlFor="email-address" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email-address"
                    name="email-address"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full rounded-md border-0 px-5 py-3 text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900 sm:max-w-xs"
                    placeholder="Enter your email"
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                  />
                  <div className="mt-3 flex items-center justify-center rounded-md shadow  sm:mt-0 sm:ml-3 sm:flex-shrink-0">
                    {emailAdded ? (
                      <span className="text-2xl">🚀</span>
                    ) : (
                      <button
                        type="submit"
                        className="flex w-full items-center justify-center rounded-md bg-gradient-to-r from-teal-500 to-cyan-600 py-3 px-4 font-medium text-white shadow hover:from-teal-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                      >
                        Notify me
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="bg-gray-50">
            <div className="mx-auto max-w-7xl space-y-6 overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
              <nav
                className="-mx-5 -my-2 flex flex-wrap justify-center"
                aria-label="Footer"
              >
                {footerNavigation.main.map((item) => (
                  <div key={item.name} className="px-5 py-2">
                    <Link href={item.href}>
                      <span className="text-base text-gray-500 hover:text-gray-900">
                        {item.name}
                      </span>
                    </Link>
                  </div>
                ))}
              </nav>
              <div className="flex justify-center space-x-6">
                <TwitterLink theme="dark" />
                <DiscordLink theme="dark" />
              </div>
              <p className="text-center text-base text-gray-400">
                &copy; 2022 Pakt, Inc. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};

export default Root;

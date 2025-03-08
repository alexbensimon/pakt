import * as amplitude from "@amplitude/analytics-browser";
import type { AppProps } from "next/app";
import "../styles/globals.css";

amplitude.init(process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY || "");

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;

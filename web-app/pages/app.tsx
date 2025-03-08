import { GoogleOAuthProvider } from "@react-oauth/google";
import { ConnectKitProvider } from "connectkit";
import { NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import { Chain, configureChains, createClient, WagmiConfig } from "wagmi";
import { localhost, polygon, polygonMumbai } from "wagmi/chains";
import { CoinbaseWalletConnector } from "wagmi/connectors/coinbaseWallet";
import { InjectedConnector } from "wagmi/connectors/injected";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import { Root } from "../components/Root";
import contractInfo from "../contracts/contract-info.json";
import { AccessTokenContext } from "../utils/context";
import { handleError } from "../utils/errors";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string;
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY as string;

const chainById: { [id: number]: Chain } = {
  1337: localhost,
  80001: polygonMumbai,
  137: polygon,
};

const { chains, provider, webSocketProvider } = configureChains(
  [chainById[Number(contractInfo.chainId)]],
  [alchemyProvider({ apiKey: ALCHEMY_API_KEY }), publicProvider()],
);

const wagmiClient = createClient({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: "Pakt",
        headlessMode: true,
      },
    }),
    new WalletConnectConnector({
      chains,
      options: {
        qrcode: false,
      },
    }),
    new InjectedConnector({
      chains,
      options: {
        name: "Injected",
      },
    }),
  ],
  provider,
  webSocketProvider,
  logger: {
    warn: (message) => handleError(message),
  },
});

const App: NextPage = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  return (
    <>
      <Head>
        <title>Pakt</title>
      </Head>
      <WagmiConfig client={wagmiClient}>
        <ConnectKitProvider theme="soft">
          <AccessTokenContext.Provider value={{ accessToken, setAccessToken }}>
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
              <Root />
            </GoogleOAuthProvider>
          </AccessTokenContext.Provider>
        </ConnectKitProvider>
      </WagmiConfig>
    </>
  );
};

export default App;

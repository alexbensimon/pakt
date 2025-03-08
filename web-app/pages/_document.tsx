import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html className="border-t-8 border-teal-500 bg-slate-100 text-gray-700">
      <Head>
        <link rel="manifest" href="manifest.json" />
        {/* this sets the color of url bar */}
        <meta name="theme-color" content="#14b8a6" />
        {/* this sets logo in Apple smartphones */}
        <link rel="apple-touch-icon" href="/logo/96.png" />
        {/* this sets the color of url bar in Apple smartphones */}
        <meta name="apple-mobile-web-app-status-bar" content="#14b8a6" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

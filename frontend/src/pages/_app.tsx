import { useState, useEffect } from "react";
import type { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/react";
import theme from "@/themes";
import Head from "next/head";
import { DESCRIPTION, TITLE } from "@/constants/texts";

// Font
import "@fontsource/inconsolata/400.css";
import "@fontsource/inconsolata/500.css";
import "@fontsource/inconsolata/600.css";
import "@fontsource/inconsolata/700.css";
import { wagmiConfig } from "@/constants/web3";
import { WagmiConfig } from "wagmi";

const App = ({ Component, pageProps }: AppProps) => {
  const [showChild, setShowChild] = useState(false);

  useEffect(() => {
    setShowChild(true);
  }, []);

  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
      </Head>
      <WagmiConfig config={wagmiConfig}>
        {typeof window === "undefined" || !showChild ? (
          <></>
        ) : (
          <ChakraProvider theme={theme}>
            <Component {...pageProps} />
          </ChakraProvider>
        )}
      </WagmiConfig>
    </>
  );
};

export default App;

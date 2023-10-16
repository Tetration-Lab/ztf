import { useState, useEffect } from "react";
import type { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/react";
import theme from "@/themes";
import Head from "next/head";
import { DESCRIPTION, TITLE } from "@/constants/texts";
import { wagmiConfig } from "@/constants/web3";
import { WagmiConfig } from "wagmi";
import { usePrices } from "@/stores/usePrices";

// Font
import "@fontsource/inconsolata/400.css";
import "@fontsource/inconsolata/500.css";
import "@fontsource/inconsolata/600.css";
import "@fontsource/inconsolata/700.css";

const App = ({ Component, pageProps }: AppProps) => {
  const [showChild, setShowChild] = useState(false);
  const { fetchPrice } = usePrices();

  useEffect(() => {
    setShowChild(true);
    fetchPrice();
  }, []);

  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
      </Head>
      {typeof window === "undefined" || !showChild ? (
        <></>
      ) : (
        <WagmiConfig config={wagmiConfig}>
          <ChakraProvider theme={theme}>
            <Component {...pageProps} />
          </ChakraProvider>
        </WagmiConfig>
      )}
    </>
  );
};

export default App;

import { useState, useEffect } from "react";
import type { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/react";
import theme from "@/themes";
import Head from "next/head";
import { DESCRIPTION, TITLE } from "@/constants/texts";
import { wagmiConfig } from "@/constants/web3";
import { WagmiConfig } from "wagmi";
import { usePrices } from "@/stores/usePrices";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleAnalytics } from "nextjs-google-analytics";

// Font
import "@fontsource/inconsolata/400.css";
import "@fontsource/inconsolata/500.css";
import "@fontsource/inconsolata/600.css";
import "@fontsource/inconsolata/700.css";
import "@fontsource/fira-code/400.css";

const client = new QueryClient();

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
        <title key="title">{TITLE}</title>
        <meta name="description" content={DESCRIPTION} key="description" />
      </Head>
      {typeof window === "undefined" || !showChild ? (
        <></>
      ) : (
        <WagmiConfig config={wagmiConfig}>
          <ChakraProvider theme={theme}>
            <QueryClientProvider client={client}>
              <GoogleAnalytics trackPageViews />
              <Component {...pageProps} />
            </QueryClientProvider>
          </ChakraProvider>
        </WagmiConfig>
      )}
    </>
  );
};

export default App;

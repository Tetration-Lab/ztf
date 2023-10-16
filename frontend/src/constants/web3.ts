import { createConfig, sepolia } from "wagmi";
import { createPublicClient, http } from "viem";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import { InjectedConnector } from "wagmi/connectors/injected";
import { createWeb3Modal } from "@web3modal/wagmi";
import { DESCRIPTION, TITLE } from "./texts";
import theme from "@/themes";

const metadata = {
  name: TITLE,
  description: DESCRIPTION,
  url: "",
  icons: [],
};
const chain = sepolia;
const chains = [chain];

export const wagmiConfig = createConfig({
  autoConnect: true,
  publicClient: createPublicClient({
    chain,
    transport: http(),
  }),
  connectors: [
    new WalletConnectConnector({
      chains,
      options: {
        projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "",
        showQrModal: false,
        metadata,
      },
    }),
    new InjectedConnector({
      chains,
      options: {
        shimDisconnect: true,
      },
    }),
  ],
});

createWeb3Modal({
  wagmiConfig,
  chains,
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "",
  themeMode: theme.config.initialColorMode,
  themeVariables: {
    "--w3m-font-family": theme.fonts.heading,
  },
});

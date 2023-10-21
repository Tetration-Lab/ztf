import { Address, configureChains, createConfig } from "wagmi";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import { InjectedConnector } from "wagmi/connectors/injected";
import { createWeb3Modal } from "@web3modal/wagmi";
import { DESCRIPTION, TITLE } from "./texts";
import theme from "@/themes";
import { publicProvider } from "wagmi/providers/public";
import { goerli, mantleTestnet, scrollSepolia } from "viem/chains";

const metadata = {
  name: TITLE,
  description: DESCRIPTION,
  url: "https://ztf.tetrationlab.com/",
  icons: ["🥷"],
};

export const chains = [
  {
    ...goerli,
    image: "/images/chains/ethereum.png",
    wormholeEnabled: true,
    ztf: "0xe52beb4e12122f9a34ae9aa14d5098c2aeec79c0" as Address,
  },
  {
    ...scrollSepolia,
    blockExplorers: {
      default: {
        name: "Scrollscan",
        url: "https://sepolia.scrollscan.dev",
      },
    },
    image: "/images/chains/scroll.png",
    wormholeEnabled: false,
    ztf: "0x5f46b422e0192e409680a983ee14ef62f3b555df" as Address,
  },
  {
    ...mantleTestnet,
    image: "/images/chains/mantle.svg",
    wormholeEnabled: false,
    ztf: "0x5f46b422e0192e409680a983ee14ef62f3b555df" as Address,
  },
];

export const getChain = (chainId: number) => {
  return chains.find((chain) => chain.id === chainId);
};

const { publicClient } = configureChains(chains, [
  publicProvider(),
  publicProvider(),
  publicProvider(),
]);

export const wagmiConfig = createConfig({
  autoConnect: true,
  publicClient,
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

export const web3Modal = createWeb3Modal({
  defaultChain: chains[0],
  wagmiConfig,
  chains,
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "",
  themeMode: theme.config.initialColorMode,
  themeVariables: {
    "--w3m-font-family": theme.fonts.heading,
    "--w3m-accent": theme.colors.primary.accent,
  },
});

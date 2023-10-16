import { createConfig, sepolia } from "wagmi";
import { createPublicClient, defineChain, http } from "viem";
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
const chain = defineChain({
  id: 11_155_111,
  network: "sepolia",
  name: "Sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "SEP", decimals: 18 },
  rpcUrls: {
    alchemy: {
      http: ["https://eth-sepolia.g.alchemy.com/v2"],
      webSocket: ["wss://eth-sepolia.g.alchemy.com/v2"],
    },
    infura: {
      http: ["https://sepolia.infura.io/v3"],
      webSocket: ["wss://sepolia.infura.io/ws/v3"],
    },
    default: {
      http: ["https://rpc.sepolia.org"],
    },
    public: {
      http: ["https://rpc.sepolia.org"],
    },
  },
  blockExplorers: {
    etherscan: {
      name: "Etherscan",
      url: "https://sepolia.etherscan.io",
    },
    default: {
      name: "Etherscan",
      url: "https://sepolia.etherscan.io",
    },
  },
  contracts: {
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      blockCreated: 751532,
    },
    ensRegistry: { address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e" },
    ensUniversalResolver: {
      address: "0x21B000Fd62a880b2125A61e36a284BB757b76025",
      blockCreated: 3914906,
    },
  },
  testnet: true,
});
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
    "--w3m-accent": theme.colors.primary.accent,
  },
});

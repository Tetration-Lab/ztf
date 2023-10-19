import { Address, Hex } from "viem";
import { goerli, mantle, scrollSepolia } from "viem/chains";

export const CURRENCY: { [address: Address]: [string, number] } = {
  "0xdeaddeaddeaddeaddeaddeaddeaddeaddead1111": ["weth", 18],
  "0x5300000000000000000000000000000000000004": ["weth", 18],
  "0xd8134205b0328f5676aaefb3b2a0dc15f4029d8c": ["sdai", 18],
  "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6": ["weth", 18],
  "0xa4c4cb2A072eE99f77212Fa18c2B7Ca26DA23905": ["wmnt", 18],
  "0x6e4f1e8d4c5e5e6e2781fd814ee0744cc16eb352": ["wsteth", 18],
};

export const CURRENCY_ID_DENOM_COINGECKO: { [id: string]: string[] } = {
  ethereum: ["weth", "eth"],
  mantle: ["wmnt", "mnt"],
  "wrapped-steth": ["wsteth"],
  "savings-dai": ["sdai"],
};

export const CURRENCY_BY_CHAIN_ID: { [chainId: number]: Address[] } = {
  [goerli.id]: [
    "0xd8134205b0328f5676aaefb3b2a0dc15f4029d8c",
    "0x6e4f1e8d4c5e5e6e2781fd814ee0744cc16eb352",
  ],
  [scrollSepolia.id]: ["0x5300000000000000000000000000000000000004"],
  [mantle.id]: [
    "0xdeaddeaddeaddeaddeaddeaddeaddeaddead1111",
    "0xa4c4cb2a072ee99f77212fa18c2b7ca26da23905",
  ],
};

export const getDenom = (address?: Address): string => {
  return CURRENCY[address?.toLowerCase() as Address]?.[0] ?? "";
};

export const getDecimal = (address?: Address): number => {
  return CURRENCY[address?.toLowerCase() as Address]?.[1] ?? 18;
};

export const ZERO_ADDRESS: Address =
  "0x0000000000000000000000000000000000000000";

export const ZERO_BYTES32: Hex =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

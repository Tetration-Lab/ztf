import { Address, Hex } from "viem";

export const CURRENCY: { [address: Address]: [string, number] } = {
  "0xdeaddeaddeaddeaddeaddeaddeaddeaddead1111": ["weth", 18],
  "0x5300000000000000000000000000000000000004": ["weth", 18],
  "0xd8134205b0328f5676aaefb3b2a0dc15f4029d8c": ["sdai", 18],
  "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6": ["weth", 18],
};

export const CURRENCY_BY_CHAIN_ID: { [chainId: number]: Address[] } = {
  5: [
    "0xd8134205b0328f5676aaefb3b2a0dc15f4029d8c",
    "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6",
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

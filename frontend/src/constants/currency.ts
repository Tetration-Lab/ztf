import { Address } from "viem";

export const CURRENCY: { [address: Address]: string } = {
  "0xdeaddeaddeaddeaddeaddeaddeaddeaddead1111": "eth",
  "0x5300000000000000000000000000000000000004": "eth",
  "0xd8134205b0328f5676aaefb3b2a0dc15f4029d8c": "sdai",
};

export const getDenom = (address: Address): string => {
  return CURRENCY[address?.toLowerCase() as Address] ?? "";
};

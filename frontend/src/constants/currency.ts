import { Address } from "viem";

export const CURRENCY: { [address: Address]: string } = {
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "eth",
  "0x628ebc64a38269e031afbdd3c5ba857483b5d048": "lseth",
  "0x6b175474e89094c44da98b954eedeac495271d0f": "dai",
};

export const getDenom = (address: Address): string => {
  return CURRENCY[address?.toLowerCase() as Address] ?? "";
};

import { getDecimal } from "@/constants/currency";
import { Address, formatUnits } from "viem";

export interface Bounty {
  id: string;
  owner: Address;
  isClaimed: boolean;
  title: string;
  lastUpdated: Date;
  ipfsHash: string;
  amount: number;
  currency: Address;
}

export const bountyFromContractData = (data: {
  index: Number;
  asset: `0x${string}`;
  flag: `0x${string}`;
  owner: `0x${string}`;
  callback: `0x${string}`;
  amount: bigint;
  claimed: boolean;
  lastUpdated: bigint;
  envHash: `0x${string}`;
  title: string;
  ipfsHash: string;
}): Bounty => {
  return {
    id: data.index.toString(),
    owner: data.owner,
    isClaimed: data.claimed,
    title: data.title,
    lastUpdated: new Date(Number(data.lastUpdated) * 1000),
    ipfsHash: data.ipfsHash,
    amount: Number(formatUnits(data.amount, getDecimal(data.asset))),
    currency: data.asset,
  };
};

export interface BountyDetail {
  links?: { title: string; description?: string; url?: string }[];
  environment?: object;
  enviroment?: object;
}

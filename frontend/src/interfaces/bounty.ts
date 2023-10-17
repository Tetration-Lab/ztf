import { Address } from "viem";

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

export interface BountyDetail {
  links?: { title: string; description?: string; url: string }[];
  environment?: object;
}

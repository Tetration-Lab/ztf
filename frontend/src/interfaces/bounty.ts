import { Address } from "viem";

export interface Bounty {
  id: string;
  owner: Address;
  isClaimed: boolean;
  title: string;
  amount: number;
  lastUpdated: Date;
  ipfsHash: string;
}

export interface BountyDetail {
  links?: { title: string; description?: string; url: string }[];
  environment?: object;
}

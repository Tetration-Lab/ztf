import { Address } from "viem";

export interface Bounty {
  id: string;
  owner: Address;
  isClaimed: boolean;
  title: string;
  amount: number;
  lastUpdated: Date;
}

export interface BountyDetail {}

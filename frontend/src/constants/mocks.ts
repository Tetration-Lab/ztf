import { Bounty } from "@/interfaces/bounty";

export const MOCK_CONTRACT_ADDRESS =
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

export const MOCK_BOUNTIES: Bounty[] = [
  {
    id: "0",
    owner: "0xC0FFEEC0FFEEC0FFEEC0FFEEC0FFEEC0FFEEC0FF",
    isClaimed: false,
    title: "Sample Bounty",
    amount: 100,
    lastUpdated: new Date("17 Oct 2023"),
    ipfsHash: "QmUhguprqR9wCh6k1f9q8SDymxffxksr6XKR1m2iTgBWGR",
    currency: "0x628ebc64a38269e031afbdd3c5ba857483b5d048",
  },
  {
    id: "1",
    owner: "0xC0FFEEC0FFEEC0FFEEC0FFEEC0FFEEC0FFEEC0FF",
    isClaimed: true,
    title: "Pwn Me!",
    amount: 12501,
    lastUpdated: new Date("17 Oct 2023"),
    ipfsHash: "QmUhguprqR9wCh6k1f9q8SDymxffxksr6XKR1m2iTgBWGR",
    currency: "0x6b175474e89094c44da98b954eedeac495271d0f",
  },
];

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
    currency: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead1111",
  },
  {
    id: "1",
    owner: "0xC0FFEEC0FFEEC0FFEEC0FFEEC0FFEEC0FFEEC0FF",
    isClaimed: true,
    title: "Pwn Me!",
    amount: 12501,
    lastUpdated: new Date("17 Oct 2023"),
    ipfsHash: "QmUhguprqR9wCh6k1f9q8SDymxffxksr6XKR1m2iTgBWGR",
    currency: "0xd8134205b0328f5676aaefb3b2a0dc15f4029d8c",
  },
];

import { Bounty } from "@/interfaces/bounty";

export const MOCK_BOUNTIES: Bounty[] = [
  {
    id: "0",
    owner: "0xC0FFEEC0FFEEC0FFEEC0FFEEC0FFEEC0FFEEC0FF",
    isClaimed: false,
    title: "Sample Bounty",
    amount: 100,
    lastUpdated: new Date("17 Oct 2023"),
  },
  {
    id: "1",
    owner: "0xC0FFEEC0FFEEC0FFEEC0FFEEC0FFEEC0FFEEC0FF",
    isClaimed: true,
    title: "Pwn Me!",
    amount: 0.25,
    lastUpdated: new Date("17 Oct 2023"),
  },
];

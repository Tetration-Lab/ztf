import { Address, parseAbi } from "viem";
import { goerli } from "viem/chains";

export const CONTRACTS: { [chainId: number]: Address } = {
  [goerli.id]: "0x797e451d2e6782565db4481cf4a68c818894eeba",
};

export const getZTFContract = (chainId: number): Address => {
  return CONTRACTS[chainId] ?? "0x0";
};

export const ZTF_ABI = parseAbi([
  "struct Asset { address asset; uint total; uint claimed; }",
  "struct Bounty { address flag; address owner; address callback; address asset; uint amount; bool claimed; uint lastUpdated; bytes32 envHash; string title; }",
  "function numBounty() view returns (uint256)",
  "function numClaimed() view returns (uint256)",
  "function getAssetStatPage(uint num, uint skip) view returns (Asset[] memory)",
  "function newBounty(address flag, address callback, address asset, uint amount, string memory title, bytes32 envHash)",
  "function getBountyPage(uint num, uint skip) view returns (Bounty[] memory)",
]);

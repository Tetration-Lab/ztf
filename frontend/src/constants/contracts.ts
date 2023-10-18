import { Address, parseAbi } from "viem";
import { goerli } from "viem/chains";

export const CONTRACTS: { [chainId: number]: Address } = {
  [goerli.id]: "0x45937CD64dCf8F0318100E16243177c9a6F6c6Bb",
};

export const getZTFContract = (chainId: number): Address => {
  return CONTRACTS[chainId] ?? "0x0";
};

export const ZTF_ABI = parseAbi([
  "struct Asset { address asset; uint total; uint claimed; }",
  "struct Bounty { address flag; address owner; address callback; address asset; uint amount; bool claimed; uint lastUpdated; bytes32 envHash; string title; string ipfsHash; }",
  "struct ZClaim { address claimer; bytes32 txs_hash; bytes32 postStateDigest; bytes seal; }",
  "function numBounty() view returns (uint256)",
  "function numClaimed() view returns (uint256)",
  "function getAssetStatPage(uint num, uint skip) view returns (Asset[] memory)",
  "function newBounty(address flag, address callback, address asset, uint256 amount, string memory title, string memory ipfsHash, bytes32 envHash)",
  "function getBountyPage(uint num, uint skip) view returns (Bounty[] memory)",
  "function bountyList(uint bountyID) view returns (Bounty memory)",
  "function claim(uint bountyID, ZClaim memory claim)",
  "event NewBounty(uint indexed bountyID, address indexed owner)",
  "event BountyClaimed(uint indexed bountyID, address indexed claimer)",
]);

export const ERC20_ABI = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function approve(address, uint256) returns (bool)",
  "function allowance(address, address) view returns (uint256)",
]);

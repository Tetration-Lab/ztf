import { BountyDetail } from "@/interfaces/bounty";
import axios from "axios";

export const fetchBountyDetailIpfs = async (
  hash: string
): Promise<BountyDetail> => {
  return axios
    .get(`https://gateway.ipfs.io/ipfs/${hash}`, { timeout: 60000 }) // with 60s timeout
    .then((r) => r.data);
};

import { IconType } from "react-icons";
import {
  FaBox,
  FaBullseye,
  FaComputer,
  FaStore,
  FaUser,
  FaUsers,
} from "react-icons/fa6";

export const TITLE = "🥷ZTF";
export const DESCRIPTION =
  "On-chain ctf with claimable bounty using zero-knowledge proof";

export const ENV_FLAG_INFO: {
  title: string;
  description: string;
  icon: IconType;
}[] = [
  {
    title: "Spec",
    description:
      "EVM's Specification/Hardfork version, e.g. `LONDON`. `LATEST` is for latest EVM version on the revm library.",
    icon: FaComputer,
  },
  {
    title: "Block Config",
    description:
      "Block configuration on the EVM. Note that the block is simulated with only the block timestamp and block hash, other aspects of actual EVM block are discarded.",
    icon: FaBox,
  },
  {
    title: "Target Condition",
    description:
      "Target topic emitted from contract to be satisfied. The condition is evaluated on the EVM state after all transactions are simulated. Gas limit can also be enforced conditionally.",
    icon: FaBullseye,
  },
  {
    title: "Allowed Accounts",
    description: "Allowed accounts to be used/create transactions",
    icon: FaUser,
  },
  {
    title: "Accounts",
    description: "Initial account's balance and optinally contract code",
    icon: FaUsers,
  },
  {
    title: "Storage",
    description: "Initial account's storage states",
    icon: FaStore,
  },
];

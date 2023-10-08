use ethers_core::types::{H160, H256};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct Receipt {
    pub hash: H256,
    pub submitter: H160,
}

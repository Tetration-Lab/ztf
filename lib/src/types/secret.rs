use ethers_core::types::H160;
use serde::{Deserialize, Serialize};

use super::{Environment, TxSim};

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct Secret {
    pub submitter: H160,
    pub txs: Vec<TxSim>,
    pub enviroment: Environment,
}

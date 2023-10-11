use revm::primitives::{hex::FromHex, Address, FixedBytes};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Default)]
pub struct TargetCondition {
    pub contract: Address,
    pub topic: FixedBytes<32>,
    pub gas_limit_tx: u64,
    pub gas_limit_accum: u64,
}

impl TargetCondition {
    pub fn new(contract: Address, topic: FixedBytes<32>) -> Self {
        Self {
            contract,
            topic,
            gas_limit_tx: 0,
            gas_limit_accum: 0,
        }
    }

    pub fn new_captured(contract: Address) -> Self {
        Self::new(
            contract,
            FixedBytes::from_hex(
                "0x63615589523f572b4bad8ebb05080156cf59cceb5f5c34ed89d054f2427f595f",
            )
            .unwrap(),
        )
    }
}

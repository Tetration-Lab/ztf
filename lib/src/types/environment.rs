use std::fmt::Display;

use ethers_core::types::H256;
use revm::primitives::{
    hex::FromHex, Address, Bytecode, FixedBytes, HashMap, HashSet, KECCAK_EMPTY, U256,
};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::db::BlockConfig;

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct Account {
    #[serde(skip_serializing_if = "Account::is_balance_zero")]
    pub balance: U256,
    pub code_hash: FixedBytes<32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub code: Option<Bytecode>,
}

impl Account {
    fn is_balance_zero(b: &U256) -> bool {
        b == &U256::ZERO
    }

    pub fn new(balance: U256, code: Option<Bytecode>) -> Self {
        let code_hash = match &code {
            Some(code) => code.hash_slow(),
            None => KECCAK_EMPTY,
        };

        Self {
            balance,
            code_hash,
            code,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct Environment {
    pub block_config: BlockConfig,
    pub target_condition: TargetCondition,
    #[serde(skip_serializing_if = "HashSet::is_empty")]
    pub allowed_accounts: HashSet<Address>,
    #[serde(skip_serializing_if = "HashMap::is_empty")]
    pub accounts: HashMap<Address, Account>,
    #[serde(skip_serializing_if = "HashMap::is_empty")]
    pub storage: HashMap<Address, HashMap<U256, U256>>,
}

impl Environment {
    pub fn as_bytes(&self) -> Vec<u8> {
        serde_json::to_vec(self).expect("Should serialize")
    }

    pub fn from_json(json: &str) -> Self {
        serde_json::from_str(json).expect("Couldn't deserialize")
    }

    pub fn hash(&self) -> H256 {
        let mut hasher = Sha256::new();
        hasher.update(self.as_bytes());
        H256::from_slice(hasher.finalize().as_slice())
    }
}

impl Display for Environment {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&serde_json::to_string_pretty(self).expect("Should serialize"))?;
        Ok(())
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct TargetCondition {
    pub contract: Address,
    pub topic: FixedBytes<32>,
    #[serde(skip_serializing_if = "TargetCondition::is_gas_limit_zero")]
    pub gas_limit_tx: u64,
    #[serde(skip_serializing_if = "TargetCondition::is_gas_limit_zero")]
    pub gas_limit_accum: u64,
}

impl TargetCondition {
    fn is_gas_limit_zero(g: &u64) -> bool {
        g == &0
    }

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

    pub fn with_gas_limit_tx(self, gas_limit_tx: u64) -> Self {
        Self {
            gas_limit_tx,
            ..self
        }
    }

    pub fn with_gas_limit_accum(self, gas_limit_accum: u64) -> Self {
        Self {
            gas_limit_accum,
            ..self
        }
    }
}

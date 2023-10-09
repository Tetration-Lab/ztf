use std::fmt::Display;

use ethers_core::types::H256;
use revm::primitives::{Address, Bytecode, FixedBytes, HashMap, KECCAK_EMPTY, U256};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::db::BlockConfig;

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct Account {
    pub balance: U256,
    pub code_hash: FixedBytes<32>,
    pub code: Option<Bytecode>,
}

impl Account {
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
    pub accounts: HashMap<Address, Account>,
    pub storage: HashMap<Address, HashMap<U256, U256>>,
}

impl Environment {
    pub fn as_bytes(&self) -> Vec<u8> {
        serde_json::to_vec(self).expect("Should serialize")
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

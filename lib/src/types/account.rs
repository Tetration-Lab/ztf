use revm::primitives::{Bytecode, FixedBytes, KECCAK_EMPTY, U256};
use serde::{Deserialize, Serialize};

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

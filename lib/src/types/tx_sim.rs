use std::fmt::Display;

use revm::primitives::{Address, Bytes, CreateScheme, TransactTo, TxEnv, U256};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub enum TxSim {
    Transaction(Transaction),
    AdvanceBlock,
}

impl TxSim {
    pub fn as_bytes(&self) -> Vec<u8> {
        match self {
            TxSim::Transaction(t) => {
                let mut bytes = vec![0];
                bytes.extend_from_slice(&t.as_bytes());
                bytes
            }
            TxSim::AdvanceBlock => vec![1],
        }
    }
}

impl Display for TxSim {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{}",
            serde_json::to_string_pretty(self).expect("Should serialize")
        )?;
        Ok(())
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct Transaction {
    pub caller: Address,
    pub transact_to: TransactTo,
    pub value: U256,
    pub data: Bytes,
    pub nonce: u64,
}

impl Transaction {
    pub fn new(
        caller: Address,
        transact_to: TransactTo,
        value: U256,
        data: Bytes,
        nonce: u64,
    ) -> Self {
        Self {
            caller,
            transact_to,
            value,
            data,
            nonce,
        }
    }

    pub fn as_bytes(&self) -> Vec<u8> {
        let mut bytes = Vec::new();
        bytes.extend_from_slice(&self.caller.to_vec());
        bytes.extend_from_slice(&match &self.transact_to {
            TransactTo::Call(a) => {
                let mut bytes = vec![0];
                bytes.extend_from_slice(&a.to_vec());
                bytes
            }
            TransactTo::Create(c) => match c {
                CreateScheme::Create => vec![1, 0],
                CreateScheme::Create2 { salt } => {
                    let mut bytes = vec![1, 1];
                    bytes.extend_from_slice(&salt.to_be_bytes::<32>());
                    bytes
                }
            },
        });
        bytes.extend_from_slice(&self.value.to_be_bytes::<32>());
        bytes.extend_from_slice(&(self.data.len() as u32).to_be_bytes());
        bytes.extend_from_slice(&self.data);
        bytes.extend_from_slice(&self.nonce.to_be_bytes());
        bytes
    }
}

impl Into<TxEnv> for Transaction {
    fn into(self) -> TxEnv {
        TxEnv {
            caller: self.caller,
            transact_to: self.transact_to,
            value: self.value,
            data: self.data,
            nonce: Some(self.nonce),
            ..Default::default()
        }
    }
}

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
    pub gas_limit: Option<u64>,
    pub access_list: Vec<(Address, Vec<U256>)>,
}

impl Transaction {
    pub fn new(
        caller: Address,
        transact_to: TransactTo,
        value: U256,
        data: Bytes,
        nonce: u64,
        gas_limit: Option<u64>,
        access_list: Vec<(Address, Vec<U256>)>,
    ) -> Self {
        Self {
            caller,
            transact_to,
            value,
            data,
            nonce,
            gas_limit,
            access_list,
        }
    }

    pub fn as_bytes(&self) -> Vec<u8> {
        let mut bytes = Vec::new();
        bytes.extend_from_slice(self.caller.as_ref());
        match &self.transact_to {
            TransactTo::Call(a) => {
                bytes.push(0);
                bytes.extend_from_slice(a.as_ref());
            }
            TransactTo::Create(c) => match c {
                CreateScheme::Create => {
                    bytes.extend_from_slice(&[1, 0]);
                }
                CreateScheme::Create2 { salt } => {
                    bytes.extend_from_slice(&[1, 1]);
                    bytes.extend_from_slice(&salt.to_be_bytes::<32>());
                }
            },
        };
        bytes.extend_from_slice(&self.value.to_be_bytes::<32>());
        bytes.extend_from_slice(&(self.data.len() as u32).to_be_bytes());
        bytes.extend_from_slice(&self.data);
        bytes.extend_from_slice(&self.nonce.to_be_bytes());
        match self.gas_limit {
            Some(gl) => {
                bytes.push(1);
                bytes.extend_from_slice(&gl.to_be_bytes())
            }
            None => bytes.push(0),
        }
        bytes.extend_from_slice(&(self.access_list.len() as u32).to_be_bytes());
        for access in &self.access_list {
            bytes.extend_from_slice(access.0.as_ref());
            bytes.extend_from_slice(&(access.1.len() as u32).to_be_bytes());
            for slot in &access.1 {
                bytes.extend_from_slice(&slot.to_be_bytes::<32>());
            }
        }

        bytes
    }
}

impl From<Transaction> for TxEnv {
    fn from(val: Transaction) -> Self {
        TxEnv {
            caller: val.caller,
            transact_to: val.transact_to,
            value: val.value,
            data: val.data,
            nonce: Some(val.nonce),
            gas_limit: val.gas_limit.unwrap_or(u64::MAX),
            access_list: val.access_list,
            ..Default::default()
        }
    }
}

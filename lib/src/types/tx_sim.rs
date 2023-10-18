use std::{fmt::Display, str::FromStr};

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

impl FromStr for TxSim {
    type Err = serde_json::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        serde_json::from_str(s)
    }
}

impl From<Transaction> for TxSim {
    fn from(val: Transaction) -> Self {
        TxSim::Transaction(val)
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

impl Default for Transaction {
    fn default() -> Self {
        Self {
            caller: Default::default(),
            transact_to: TransactTo::Call(Default::default()),
            value: Default::default(),
            data: Default::default(),
            nonce: Default::default(),
            gas_limit: Default::default(),
            access_list: Default::default(),
        }
    }
}

impl FromStr for Transaction {
    type Err = serde_json::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        serde_json::from_str(s)
    }
}

impl Transaction {
    pub fn builder() -> TransactionBuilder {
        TransactionBuilder::new()
    }

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

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct TransactionBuilder(Transaction);

impl TransactionBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn build(self) -> Transaction {
        self.0
    }

    pub fn caller(mut self, caller: Address) -> Self {
        self.0.caller = caller;
        self
    }

    pub fn transact_to(mut self, transact_to: TransactTo) -> Self {
        self.0.transact_to = transact_to;
        self
    }

    pub fn to(mut self, to: Address) -> Self {
        self.0.transact_to = TransactTo::Call(to);
        self
    }

    pub fn create(mut self) -> Self {
        self.0.transact_to = TransactTo::Create(CreateScheme::Create);
        self
    }

    pub fn create2(mut self, salt: U256) -> Self {
        self.0.transact_to = TransactTo::Create(CreateScheme::Create2 { salt });
        self
    }

    pub fn value(mut self, value: U256) -> Self {
        self.0.value = value;
        self
    }

    pub fn data(mut self, data: Bytes) -> Self {
        self.0.data = data;
        self
    }

    pub fn nonce(mut self, nonce: u64) -> Self {
        self.0.nonce = nonce;
        self
    }

    pub fn gas_limit(mut self, gas_limit: Option<u64>) -> Self {
        self.0.gas_limit = gas_limit;
        self
    }

    pub fn access_list(mut self, access_list: Vec<(Address, Vec<U256>)>) -> Self {
        self.0.access_list = access_list;
        self
    }

    pub fn access(mut self, address: Address, slots: Vec<U256>) -> Self {
        self.0.access_list.push((address, slots));
        self
    }
}

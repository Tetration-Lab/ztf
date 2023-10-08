use ethers_core::types::H160;
use revm::primitives::{Address, Bytes, CreateScheme, TransactTo, TxEnv, U256};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct TxSim {
    pub caller: Address,
    pub transact_to: TransactTo,
    pub value: U256,
    pub data: Bytes,
    pub nonce: u64,
}

impl TxSim {
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
            TransactTo::Call(a) => a.to_vec(),
            TransactTo::Create(c) => match c {
                CreateScheme::Create => vec![0],
                CreateScheme::Create2 { salt } => {
                    let mut bytes = vec![1];
                    bytes.extend_from_slice(&salt.to_be_bytes::<32>());
                    bytes
                }
            },
        });
        bytes.extend_from_slice(&self.value.to_be_bytes::<32>());
        bytes.extend_from_slice(&self.data);
        bytes.extend_from_slice(&self.nonce.to_be_bytes());
        bytes
    }
}

impl Into<TxEnv> for TxSim {
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

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct Secret {
    pub submitter: H160,
    pub txs: Vec<TxSim>,
}

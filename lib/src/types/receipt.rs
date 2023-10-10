use std::fmt::Display;

use ethers_core::{types::H256, utils::hex};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
/// Receipt is the public output/state of the proving process.
/// Used fixed bytes to reduce ethers serialization overhead.
pub struct Receipt {
    /// Address/H160
    pub submitter: [u8; 20],
    /// H256
    pub txs_hash: [u8; 32],
    /// H256
    pub enviroment_hash: [u8; 32],
}

impl Receipt {
    pub fn as_bytes(&self) -> Vec<u8> {
        let mut receipt_words: Vec<u32> = vec![];
        receipt_words.extend_from_slice(&self.submitter.map(|e| e as u32));
        receipt_words.extend_from_slice(&self.txs_hash.map(|e| e as u32));
        receipt_words.extend_from_slice(&self.enviroment_hash.map(|e| e as u32));
        receipt_words
            .iter()
            .flat_map(|word| word.to_le_bytes().to_vec())
            .collect()
    }

    pub fn hash(&self) -> H256 {
        let mut hasher = Sha256::new();
        hasher.update(self.as_bytes());
        H256::from_slice(hasher.finalize().as_slice())
    }
}

impl Display for Receipt {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "submitter: 0x{}, txs_hash: 0x{}, enviroment_hash: 0x{}",
            hex::encode(self.submitter),
            hex::encode(self.txs_hash),
            hex::encode(self.enviroment_hash)
        )?;
        Ok(())
    }
}

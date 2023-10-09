use ethers_core::types::H256;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
/// Receipt is the public output/state of the proving process.
/// Used fixed bytes to reduce ethers serialization overhead.
pub struct Receipt {
    /// H256
    pub hash: [u8; 32],
    /// Address/H160
    pub submitter: [u8; 20],
}

impl Receipt {
    pub fn as_bytes_manual(&self) -> Vec<u8> {
        let mut receipt_words: Vec<u32> = vec![];
        receipt_words.extend_from_slice(&self.hash.map(|e| e as u32));
        receipt_words.extend_from_slice(&self.submitter.map(|e| e as u32));
        receipt_words
            .iter()
            .flat_map(|word| word.to_le_bytes().to_vec())
            .collect()
    }

    pub fn as_bytes(&self) -> Vec<u8> {
        let words = risc0_zkvm::serde::to_vec(self).expect("Guaranteed to be casted to vec");
        bytemuck::cast_slice(&words).to_vec()
    }

    pub fn hash(&self) -> H256 {
        let mut hasher = Sha256::new();
        hasher.update(self.as_bytes());
        H256::from_slice(hasher.finalize().as_slice())
    }
}

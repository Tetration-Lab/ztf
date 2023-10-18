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

#[cfg(test)]
mod tests {
    use std::{error::Error, str::FromStr};

    use ethers_core::types::{Address, H256};
    use risc0_zkvm::serde::to_vec;

    use super::Receipt;

    #[test]
    fn correct_receipt_risc0_bytes_repr() -> Result<(), Box<dyn Error>> {
        let receipt = Receipt {
            submitter: Address::from_str("0x388C818CA8B9251b393131C08a736A67ccB19297")?
                .to_fixed_bytes(),
            txs_hash: H256::from_str(
                "0xf917aec90938d013706032901593abeaecdca22e77468aff7711eee087bad41b",
            )?
            .to_fixed_bytes(),
            enviroment_hash: H256::from_str(
                "0x25e6fae36753c9598ef4ab3cb7856cc8094e3ee63f07538bdd6b12445b2c9e28",
            )?
            .to_fixed_bytes(),
        };

        assert_eq!(
            receipt.as_bytes(),
            bytemuck::cast_slice::<u32, u8>(&to_vec(&receipt)?)
        );

        Ok(())
    }
}

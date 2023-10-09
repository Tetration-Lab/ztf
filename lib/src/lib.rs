use std::error::Error;

use ethers_core::types::{H160, H256};
use once_cell::sync::Lazy;
use revm::{
    db::{CacheDB, EmptyDB},
    primitives::{AccountInfo, Address, Bytes, TransactTo, KECCAK_EMPTY, U256},
    EVM,
};
use sha2::{Digest, Sha256};
use types::{Receipt, Secret, TxSim};

pub mod types;

static ONE_ETHER: Lazy<U256> = Lazy::new(|| U256::from(1_000_000_000_000_000_000u128));
// private key = "28982b6f5acdf60d79a7efd9b079372be5a0aa79ccf9ceedc2ffe63b5e264d7d"
static ADDRESS: Lazy<Address> = Lazy::new(|| {
    "0x740671Cb8847876D34b4635dF461DE3b56804807"
        .parse()
        .expect("Unable to parse address")
});

pub fn secret() -> Result<Secret, Box<dyn Error>> {
    let secret = Secret {
        submitter: H160::from_slice(&ADDRESS.to_vec()),
        txs: vec![TxSim {
            caller: *ADDRESS,
            transact_to: TransactTo::Call(Address::ZERO),
            value: U256::from(1) * *ONE_ETHER,
            data: Bytes::new(),
            nonce: 0,
        }],
    };

    Ok(secret)
}

pub fn transact(secret: Secret) -> Result<Receipt, Box<dyn Error>> {
    let mut cache_db = CacheDB::new(EmptyDB::new());
    cache_db.insert_account_info(
        *ADDRESS,
        AccountInfo {
            balance: U256::from(2) * *ONE_ETHER,
            nonce: 0,
            code_hash: KECCAK_EMPTY,
            code: None,
        },
    );

    let mut evm = EVM::new();
    evm.database(cache_db);

    let mut hasher = Sha256::new();
    for tx in secret.txs {
        assert!(tx.caller == *ADDRESS, "Invalid caller");
        hasher.update(&tx.as_bytes());
        evm.env.tx = tx.into();
        let result = evm.transact_commit()?;
        assert!(result.is_success(), "Transaction failed");
    }
    let hash_output = H256::from_slice(hasher.finalize().as_slice());

    Ok(Receipt {
        hash: hash_output.to_fixed_bytes(),
        submitter: secret.submitter.to_fixed_bytes(),
    })
}

#[cfg(test)]
mod tests {
    use std::error::Error;

    use crate::{secret, transact};

    #[test]
    fn test_transact() -> Result<(), Box<dyn Error>> {
        let secret = secret().expect("Unable to get secret");
        let receipt = transact(secret).expect("Unable to transact");
        println!("Receipt: {:?}", receipt);
        println!("Receipt hash: {:?}", receipt.hash());

        Ok(())
    }
}

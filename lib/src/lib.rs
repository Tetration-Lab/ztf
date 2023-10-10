use std::error::Error;

use db::{BlockConfig, CachedBlockDB};
use ethers_core::types::{H160, H256};
use once_cell::sync::Lazy;
use revm::{
    primitives::{Address, Bytes, HashMap, HashSet, TransactTo, U256},
    EVM,
};
use sha2::{Digest, Sha256};
use types::{Account, Environment, Receipt, Secret, Transaction, TxSim};

pub mod db;
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
        txs: vec![
            TxSim::AdvanceBlock,
            TxSim::Transaction(Transaction {
                caller: *ADDRESS,
                transact_to: TransactTo::Call(Address::ZERO),
                value: U256::from(1) * *ONE_ETHER,
                data: Bytes::new(),
                nonce: 0,
            }),
        ],
        enviroment: Environment {
            accounts: HashMap::from_iter([(
                *ADDRESS,
                Account::new(U256::from(2) * *ONE_ETHER, None),
            )]),
            storage: HashMap::new(),
            block_config: BlockConfig {
                block_time_sec: 15,
                start_timestamp: 0,
                start_block: 0,
            },
            allowed_accounts: HashSet::from_iter([*ADDRESS]),
        },
    };

    Ok(secret)
}

pub fn transact(secret: Secret) -> Result<Receipt, Box<dyn Error>> {
    let mut db = CachedBlockDB::new(secret.enviroment.block_config);
    let mut evm = EVM::new();

    let enviroment_hash = secret.enviroment.hash();
    db.setup_environment(&secret.enviroment);
    evm.database(db);

    let mut hasher = Sha256::new();
    for tx_sim in secret.txs {
        hasher.update(&tx_sim.as_bytes());
        match tx_sim {
            TxSim::Transaction(tx) => {
                secret
                    .enviroment
                    .allowed_accounts
                    .contains(&tx.caller)
                    .then_some(())
                    .expect("Caller not allowed");
                evm.env.tx = tx.into();
                evm.env.block = evm.db.as_ref().unwrap().block_env();
                let result = evm.transact_commit()?;
                assert!(result.is_success(), "Transaction failed");
            }
            TxSim::AdvanceBlock => {
                evm.db.as_mut().unwrap().advance();
            }
        }
    }
    let txs_hash = H256::from_slice(hasher.finalize().as_slice());

    Ok(Receipt {
        submitter: secret.submitter.to_fixed_bytes(),
        txs_hash: txs_hash.to_fixed_bytes(),
        enviroment_hash: enviroment_hash.to_fixed_bytes(),
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
        println!("Receipt: {}", receipt);
        println!("Receipt hash: {:?}", receipt.hash());

        Ok(())
    }
}

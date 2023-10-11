use std::error::Error;

use db::CachedBlockDB;
use ethers_core::types::H256;
use revm::EVM;
use sha2::{Digest, Sha256};
use types::{Receipt, Secret, TxSim};

pub mod db;
pub mod types;

#[cfg(feature = "debug-secret")]
pub mod secrets;

#[cfg(feature = "utils")]
pub mod utils;

pub fn transact(secret: Secret) -> Result<Receipt, Box<dyn Error>> {
    let mut db = CachedBlockDB::new(secret.enviroment.block_config);
    let mut evm = EVM::new();

    let enviroment_hash = secret.enviroment.hash();
    db.setup_environment(&secret.enviroment);
    evm.database(db);
    evm.env.cfg.spec_id = secret.enviroment.spec;

    let mut hasher = Sha256::new();
    let mut gas_used_accum = 0u64;
    let mut target_met = false;
    for (_i, tx_sim) in secret.txs.into_iter().enumerate() {
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
                let gas_used = result.gas_used();
                assert!(
                    secret.enviroment.target_condition.gas_limit_tx == 0
                        || gas_used <= secret.enviroment.target_condition.gas_limit_tx,
                    "Gas limit exceeded"
                );
                gas_used_accum += gas_used;

                for log in result.logs().iter().rev() {
                    if log.address == secret.enviroment.target_condition.contract
                        && log.topics[0] == secret.enviroment.target_condition.topic
                    {
                        target_met = true;
                        break;
                    }
                }
            }
            TxSim::AdvanceBlock => {
                evm.db.as_mut().unwrap().advance();
            }
        }
    }

    assert!(target_met, "Target condition not met");
    assert!(
        secret.enviroment.target_condition.gas_limit_accum == 0
            || gas_used_accum <= secret.enviroment.target_condition.gas_limit_accum,
        "Gas accum limit exceeded"
    );

    let txs_hash = H256::from_slice(hasher.finalize().as_slice());

    Ok(Receipt {
        submitter: secret.submitter.to_fixed_bytes(),
        txs_hash: txs_hash.to_fixed_bytes(),
        enviroment_hash: enviroment_hash.to_fixed_bytes(),
    })
}

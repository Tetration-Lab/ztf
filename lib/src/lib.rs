use std::error::Error;

use anyhow::anyhow;
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

/// Transact a secret and return the receipt.
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
                    .ok_or(anyhow!("Caller not allowed"))?;
                evm.env.tx = tx.into();
                evm.env.block = evm.db.as_ref().unwrap().block_env();
                let result = evm.transact_commit()?;
                result
                    .is_success()
                    .then_some(())
                    .ok_or(anyhow!("Transaction failed at index {_i}: {:?}", result))?;
                let gas_used = result.gas_used();
                (secret.enviroment.target_condition.gas_limit_tx == 0
                    || gas_used <= secret.enviroment.target_condition.gas_limit_tx)
                    .then_some(())
                    .ok_or(anyhow!(
                        "Gas limit exceeded, maximum {} found {}",
                        secret.enviroment.target_condition.gas_limit_tx,
                        gas_used
                    ))?;

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

    target_met
        .then_some(())
        .ok_or(anyhow!("Target condition not met"))?;

    (secret.enviroment.target_condition.gas_limit_accum == 0
        || gas_used_accum <= secret.enviroment.target_condition.gas_limit_accum)
        .then_some(())
        .ok_or(anyhow!(
            "Gas limit exceeded, maximum {} found {}",
            secret.enviroment.target_condition.gas_limit_accum,
            gas_used_accum
        ))?;

    let txs_hash = H256::from_slice(hasher.finalize().as_slice());

    Ok(Receipt {
        submitter: secret.submitter.to_fixed_bytes(),
        txs_hash: txs_hash.to_fixed_bytes(),
        enviroment_hash: enviroment_hash.to_fixed_bytes(),
    })
}

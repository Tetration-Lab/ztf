use anyhow::{anyhow, Error};
use revm::{
    db::{CacheDB, DatabaseRef, EmptyDB},
    primitives::{AccountInfo, Address, BlockEnv, Bytecode, HashMap, B256, U256},
    Database, DatabaseCommit,
};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::types::Environment;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub struct BlockConfig {
    pub block_time_sec: u64,
    pub start_timestamp: u64,
    pub start_block: u64,
}

impl Default for BlockConfig {
    fn default() -> Self {
        Self {
            block_time_sec: 15,
            start_timestamp: 0,
            start_block: 0,
        }
    }
}

impl BlockConfig {
    pub fn as_bytes(&self) -> Vec<u8> {
        serde_json::to_vec(self).expect("Should serialize")
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub block_number: u64,
    pub timestamp: u64,
    pub hash: B256,
}

#[derive(Debug, Clone)]
pub struct CachedBlockDB {
    pub block_config: BlockConfig,
    pub block_number: u64,
    pub blocks: HashMap<u64, Block>,
    pub db: CacheDB<EmptyDB>,
}

impl CachedBlockDB {
    pub fn new(block_config: BlockConfig) -> Self {
        Self {
            block_number: 0,
            blocks: {
                let mut blocks = HashMap::new();
                let mut hasher = Sha256::new();
                hasher.update(&block_config.as_bytes());
                blocks.insert(
                    0,
                    Block {
                        block_number: 0,
                        timestamp: block_config.start_timestamp,
                        hash: B256::from_slice(&hasher.finalize()),
                    },
                );
                blocks
            },
            block_config,
            db: CacheDB::new(EmptyDB::new()),
        }
    }

    pub fn advance(&mut self) {
        let next_block_number = self.block_number + 1;
        let last_block = &self.blocks[&self.block_number];
        let mut hasher = Sha256::new();
        hasher.update(last_block.hash);
        let hash = B256::from_slice(&hasher.finalize());
        self.blocks.insert(
            next_block_number,
            Block {
                block_number: next_block_number,
                timestamp: last_block.timestamp + self.block_config.block_time_sec as u64,
                hash,
            },
        );
        self.block_number = next_block_number;
    }

    pub fn block_env(&self) -> BlockEnv {
        BlockEnv {
            number: U256::from(self.block_number),
            timestamp: U256::from(self.blocks[&self.block_number].timestamp),
            ..Default::default()
        }
    }

    pub fn setup_environment(&mut self, env: &Environment) {
        env.accounts.iter().for_each(|(address, account)| {
            self.db.insert_account_info(
                *address,
                AccountInfo {
                    balance: account.balance,
                    nonce: 0,
                    code_hash: account.code_hash,
                    code: account.code.clone(),
                },
            );
        });
        env.storage.iter().for_each(|(address, storage)| {
            storage.iter().for_each(|(key, value)| {
                self.db.insert_account_storage(*address, *key, *value).ok();
            });
        });
    }
}

impl Database for CachedBlockDB {
    type Error = Error;

    #[doc = " Get basic account information."]
    fn basic(&mut self, address: Address) -> Result<Option<AccountInfo>, Self::Error> {
        Ok(Database::basic(&mut self.db, address)?)
    }

    #[doc = " Get account code by its hash."]
    fn code_by_hash(&mut self, code_hash: B256) -> Result<Bytecode, Self::Error> {
        Ok(Database::code_by_hash(&mut self.db, code_hash)?)
    }

    #[doc = " Get storage value of address at index."]
    fn storage(&mut self, address: Address, index: U256) -> Result<U256, Self::Error> {
        Ok(Database::storage(&mut self.db, address, index)?)
    }

    #[doc = " Get block hash by block number."]
    fn block_hash(&mut self, number: U256) -> Result<B256, Self::Error> {
        self.blocks
            .get(&number.to::<u64>())
            .map(|block| block.hash)
            .ok_or_else(|| anyhow!("Block not found"))
    }
}

impl DatabaseRef for CachedBlockDB {
    type Error = Error;

    #[doc = " Get basic account information."]
    fn basic(&self, address: Address) -> Result<Option<AccountInfo>, Self::Error> {
        Ok(DatabaseRef::basic(&self.db, address)?)
    }

    #[doc = " Get account code by its hash."]
    fn code_by_hash(&self, code_hash: B256) -> Result<Bytecode, Self::Error> {
        Ok(DatabaseRef::code_by_hash(&self.db, code_hash)?)
    }

    #[doc = " Get storage value of address at index."]
    fn storage(&self, address: Address, index: U256) -> Result<U256, Self::Error> {
        Ok(DatabaseRef::storage(&self.db, address, index)?)
    }

    #[doc = " Get block hash by block number."]
    fn block_hash(&self, number: U256) -> Result<B256, Self::Error> {
        self.blocks
            .get(&number.to::<u64>())
            .map(|block| block.hash)
            .ok_or_else(|| anyhow!("Block not found"))
    }
}

impl DatabaseCommit for CachedBlockDB {
    fn commit(&mut self, changes: HashMap<Address, revm::primitives::Account>) {
        self.db.commit(changes)
    }
}

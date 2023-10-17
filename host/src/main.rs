use std::{error::Error, str::FromStr, time::Instant};

use ethers_core::types::Address;
use lib::{secrets::totally_not_a_backdoor, types::Receipt};
use methods::{ZTF_ELF, ZTF_ID};
use risc0_zkvm::{
    default_prover,
    serde::{from_slice, to_vec},
    ExecutorEnv,
};

fn main() -> Result<(), Box<dyn Error>> {
    let mut secret = totally_not_a_backdoor()?;
    secret.submitter = Address::from_str("0xD27647Ec30C49D3574a3AAC7aAa9758e930CCfaC")?;

    let env = ExecutorEnv::builder()
        .add_input(&to_vec(&secret)?)
        .build()?;

    let prover = default_prover();

    let now = Instant::now();
    let transcript = prover.prove_elf(env, ZTF_ELF)?;
    let receipt = from_slice::<Receipt, _>(&transcript.journal)?;

    println!("Receipt: {}", receipt);
    println!("Metadata: {:?}", transcript.get_metadata()?);
    println!("Time used to prove: {:.2}s", now.elapsed().as_secs_f64());

    transcript.verify(ZTF_ID)?;

    Ok(())
}

use std::{error::Error, time::Instant};

use lib::{secrets::totally_not_a_backdoor, types::Receipt};
use methods::{ZTF_ELF, ZTF_ID};
use risc0_zkvm::{
    default_prover,
    serde::{from_slice, to_vec},
    ExecutorEnv,
};

fn main() -> Result<(), Box<dyn Error>> {
    let secret = totally_not_a_backdoor()?;

    let env = ExecutorEnv::builder()
        .add_input(&to_vec(&secret)?)
        .build()?;

    let prover = default_prover();

    let now = Instant::now();
    let transcript = prover.prove_elf(env, ZTF_ELF)?;
    let receipt = from_slice::<Receipt, _>(&transcript.journal)?;

    println!("Receipt: {}", receipt);
    println!("Metadata digest: {}", transcript.get_metadata()?.digest()?);
    println!("Time used to prove: {:.2}s", now.elapsed().as_secs_f64());

    transcript.verify(ZTF_ID)?;

    Ok(())
}

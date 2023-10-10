use std::{error::Error, time::Instant};

use lib::{secret, types::Receipt};
use methods::{ZTF_ELF, ZTF_ID};
use risc0_zkvm::{
    default_prover,
    serde::{from_slice, to_vec},
    ExecutorEnv,
};

fn main() -> Result<(), Box<dyn Error>> {
    let secret = secret()?;

    let env = ExecutorEnv::builder()
        .add_input(&to_vec(&secret)?)
        .build()?;

    let prover = default_prover();

    let now = Instant::now();
    let transcript = prover.prove_elf(env, ZTF_ELF)?;
    let metadata = transcript.get_metadata()?;
    let receipt = from_slice::<Receipt, _>(&transcript.journal)?;

    let _bytes = metadata.output.as_bytes();
    println!("Receipt: {}", receipt);
    println!("Time used to prove: {:.2}s", now.elapsed().as_secs_f64());

    transcript.verify(ZTF_ID)?;

    Ok(())
}

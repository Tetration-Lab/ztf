use std::{error::Error, time::Instant};

use lib::{secret, types::Receipt};
use methods::{ZTF_ELF, ZTF_ID};
use risc0_zkvm::{
    default_prover,
    serde::{from_slice, to_vec},
    sha::rust_crypto::{Digest, Sha256},
    ExecutorEnv,
};

fn sha256(data: &[u8]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(data);
    hasher.finalize().into()
}

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

    let bytes = metadata.output.as_bytes();
    println!("Journal digest: {:x?}", bytes);
    println!("Manual reciept digest: {:x?}", sha256(&transcript.journal));

    println!("Receipt: {:#?}", receipt);
    println!("Time used to prove: {:.2}s", now.elapsed().as_secs_f64());

    transcript.verify(ZTF_ID)?;

    Ok(())
}

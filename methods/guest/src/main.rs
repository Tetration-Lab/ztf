#![no_main]

use lib::{transact, types::Secret};
use risc0_zkvm::guest::env;

risc0_zkvm::guest::entry!(main);

pub fn main() {
    let secret = env::read::<Secret>();
    let receipt = transact(secret).expect("Should transact successfully");
    env::commit(&receipt);
}

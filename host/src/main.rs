use std::{env, error::Error, str::FromStr, time::Duration};

use bonsai_sdk::alpha::Client;
use dotenvy::dotenv;
use ethers_core::types::Address;
use lib::{secrets::totally_not_a_backdoor, utils::snark::g16_seal_to_token_bytes};
use log::{debug, info};
use methods::{ZTF_ELF, ZTF_ID};
use risc0_zkvm::{
    serde::{from_slice, to_vec},
    MemoryImage, Program, Receipt, MEM_SIZE, PAGE_SIZE,
};

fn main() -> Result<(), Box<dyn Error>> {
    env_logger::builder()
        .filter_level(log::LevelFilter::Info)
        .parse_default_env()
        .init();
    dotenv().ok();
    let client = Client::from_env()?;

    let img_id = {
        let program = Program::load_elf(ZTF_ELF, MEM_SIZE as u32)?;
        let image = MemoryImage::new(&program, PAGE_SIZE as u32)?;
        let image_id = hex::encode(image.compute_id());
        let image = bincode::serialize(&image)?;
        client.upload_img(&image_id, image)?;
        image_id
    };
    info!("Image id: 0x{}", img_id);

    // Create a secret
    let mut secret = totally_not_a_backdoor()?;
    secret.submitter = Address::from_str(&env::var("ADDRESS")?)?;
    info!("Submitter: {:?}", secret.submitter);

    let input_data = bytemuck::cast_slice(&to_vec(&secret)?).to_vec();
    let input_id = client.upload_input(input_data)?;

    let session = client.create_session(img_id, input_id)?;
    debug!("Created session: {}", session.uuid);
    let receipt = loop {
        let res = session.status(&client)?;
        if res.status == "RUNNING" {
            debug!(
                "Current status: {} - state: {} - continue polling...",
                res.status,
                res.state.unwrap_or_default()
            );
            std::thread::sleep(Duration::from_secs(15));
            continue;
        }
        if res.status == "SUCCEEDED" {
            // Download the receipt, containing the output
            let receipt_url = res
                .receipt_url
                .expect("API error, missing receipt on completed session");

            let receipt_buf = client.download(&receipt_url)?;
            let receipt: Receipt = bincode::deserialize(&receipt_buf)?;
            receipt.verify(ZTF_ID).expect("Receipt verification failed");
            break receipt;
        } else {
            panic!(
                "Workflow exited: {} - | err: {}",
                res.status,
                res.error_msg.unwrap_or_default()
            );
        }
    };

    let journal = from_slice::<lib::types::Receipt, _>(&receipt.journal)?;

    let metadata = receipt.get_metadata()?;

    debug!("Receipt: {}", journal);
    info!("Env Hash: 0x{}", hex::encode(journal.enviroment_hash));
    info!("Txs Hash: 0x{}", hex::encode(journal.txs_hash));
    debug!("Metadata: {:?}", metadata);
    debug!("Pre state digest: 0x{}", metadata.pre.digest());

    let snark_session = client.create_snark(session.uuid)?;
    debug!("Created snark session: {}", snark_session.uuid);
    let snark_receipt = loop {
        let res = snark_session.status(&client)?;
        match res.status.as_str() {
            "RUNNING" => {
                debug!("Current status: {} - continue polling...", res.status);
                std::thread::sleep(Duration::from_secs(20));
                continue;
            }
            "SUCCEEDED" => {
                let snark_receipt = res.output;
                if let Some(snark_receipt) = snark_receipt {
                    break snark_receipt;
                } else {
                    panic!("API error, missing snark receipt on completed session");
                }
            }
            _ => {
                panic!(
                    "Workflow exited: {} err: {}",
                    res.status,
                    res.error_msg.unwrap_or_default()
                );
            }
        }
    };
    let seal_bytes = g16_seal_to_token_bytes(&snark_receipt.snark)?;
    info!(
        "Seal bytes: 0x{}",
        hex::encode(seal_bytes.into_bytes().unwrap())
    );
    info!(
        "Post state digest: 0x{}",
        hex::encode(snark_receipt.post_state_digest)
    );

    Ok(())
}

use anyhow::{anyhow, Result};
use bonsai_sdk::alpha::responses::Groth16Seal;
use ethers_core::{
    abi::{encode, Token, Tokenizable},
    types::U256,
};

/// Convert a Risc-0's [Groth16Seal] to ethers's [Token] in the form of Seal struct.
pub fn g16_seal_to_token_struct(proof: &Groth16Seal) -> Result<Token> {
    (proof.b.len() == 2
        && [&proof.a, &proof.c]
            .into_iter()
            .chain(proof.b.iter())
            .all(|p| p.len() == 2))
    .then_some(())
    .ok_or(anyhow!("Invalid Groth16Seal"))?;
    Ok(Token::FixedArray(vec![
        Token::FixedArray(
            proof
                .a
                .iter()
                .map(|elm| U256::from_big_endian(elm).into_token())
                .collect(),
        ),
        Token::FixedArray(vec![
            Token::FixedArray(
                proof.b[0]
                    .iter()
                    .map(|elm| U256::from_big_endian(elm).into_token())
                    .collect(),
            ),
            Token::FixedArray(
                proof.b[1]
                    .iter()
                    .map(|elm| U256::from_big_endian(elm).into_token())
                    .collect(),
            ),
        ]),
        Token::FixedArray(
            proof
                .c
                .iter()
                .map(|elm| U256::from_big_endian(elm).into_token())
                .collect(),
        ),
    ]))
}

/// Convert a Risc-0's [Groth16Seal] to ethers's [Token] in the form of bytes.
pub fn g16_seal_to_token_bytes(proof: &Groth16Seal) -> Result<Token> {
    Ok(Token::Bytes(encode(&[g16_seal_to_token_struct(proof)?])))
}

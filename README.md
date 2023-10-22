# ZTF

Blockchain CTF with bounty on steriod 💪

## Generate Proof

Change directory to `host`

```bash
cd host
```

Setup environment, change the value to your desired value.

```bash
cp .env.example .env
vim .env
```

Edit environment and input transactions sequence.

```bash
vim src/main.rs
```

```rust
// Modify this line to change the secret
//let mut secret = totally_not_a_backdoor()?;
//secret.submitter = submitter;
//secret
panic!("Please provide a txs path");
```

Run binary to generate proof. The proof and parameters that is required to claim the bounty will be printed out in `stdout`.

```bash
cargo run --release
# Image ID: ...
# Submitter: ...
# Txs Hash: ...
# Env Hash: ...
# Seal bytes: ...
# Post state digest: ...
```

Please recheck the `Image Id` and compare it with contract's `PRE_STATE_DIGEST` (Or in UI's claim page). If it's different, please rerun with `cargo run --release -- --IMAGE_ID={PRE_STATE_DIGEST}`

Or optionally, run the binary with `--txs-path` and `--env-path` to load the transactions and environment from a file instead. See `sanity.txs.json` and `sanity.env.json` for example.

```bash
cargo run --release -- --txs-path sanity.txs.json --env-path sanity.env.json
```

## Run Frontend Locally

Change directory to `frontend`

```bash
cd frontend
```

Setup environment, change the value to your desired value.

```bash
cp .env.example .env
vim .env
```

Install dependencies and run locally.

```bash
yarn && yarn dev
```

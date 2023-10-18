import { InfoSection } from "@/components/Section/InfoSection";
import { AppHeader, Navbar, Section } from "@/components/common";
import { ZTF_ABI, getZTFContract } from "@/constants/contracts";
import {
  Button,
  Code,
  HStack,
  Heading,
  Icon,
  IconButton,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  useDisclosure,
} from "@chakra-ui/react";
import _ from "lodash";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FaTrashCan } from "react-icons/fa6";
import { Address, Hex } from "viem";
import { useChainId, usePublicClient, useWalletClient } from "wagmi";
import { InputField } from "@/components/Input/InputField";

const SetupDetails = () => {
  return (
    <>
      <InfoSection
        index={1}
        title="Setup"
        steps={[
          "Install Rust, then clone the repo and install dependencies.",
          <Code w="full">git clone https://github.com/Tetration-Lab/ztf</Code>,
          <Code w="full">cd ztf</Code>,
          <Code w="full">cargo check</Code>,
        ]}
      />
      <InfoSection
        index={2}
        title="Load Environment And Prepare Attack Vector"
        description="View bounty information and load the bounty's environment."
        steps={[
          "In the ztf website, navigate to the bounties list and select a bounty. Click on the `View` button to view the bounty details.",
          "In the bounty details page, hover over `Environment` section and click copy button, this will copy the environment json to your clipboard.",
          "Go to `host` package in the Rust repo or create new package and import the `lib` library, parse `Environment` struct from the json to load it.",
          <Code w="full">
            let env = Environment::from_str(// json string here
            //).expect("Invalid environment json");
          </Code>,
          "Prepare the exploits transactions and create a vector of `TxSim` attack vector. The `TxSim` is a enum that contains either `Transaction` that represents a transaction to be executed, or `AdvanceBlock` that advances the vm by 1 block.",
          <Code w="full" whiteSpace="pre-wrap">
            {`let txs = vec![
  TxSim::Transaction(Transaction::builder()...build()),
  TxSim::AdvanceBlock,
  ...
];`}
          </Code>,
          "Simulate against `transact` function using above environment and txs vector. The `transact` function will raise an error if bounty's target condition is not met.",
          <Code w="full">
            {`let result = transact(Secret { submitter: Address::from(...), txs, environment: env }).expect("Attacl vector failed");`}
          </Code>,
        ]}
      />
      <InfoSection
        index={3}
        title="Generate STARK And SNARK Proof"
        description="Generate STARK proof from the attack vector and generate SNARK proof from the STARK proof. The SNARK proof is the one that will be submitted to the contract."
        steps={[
          "With correct attack vector in hand, we can generate a valid STARK proof.",
          "Replace the `secret` variable `main.rs` in the `host` package with the `Secret` struct from the previous step.",
          "Create the `.env` file in the `host` package and add the content from the example `.env.example` file. Replace the file content with your desired values.",
          <Code w="full">
            BONSAI_API_URL=...
            <br />
            BONSAI_API_KEY=...
            <br />
            ADDRESS=...
          </Code>,
          "Run the package with `cargo run --release`. The result in `stdout` will prints out all necessary information to claim the bounty.",
          <Code w="full">cargo run --release</Code>,
        ]}
      />
    </>
  );
};

interface BountyClaimInfo {
  bountyId: number;
  claimer: Address;
  txsHash: Hex;
  postStateDigest: Hex;
  seal: Hex;
}

export const ClaimPage = () => {
  const {
    register,
    formState: { errors, isDirty },
    handleSubmit,
    reset,
  } = useForm<BountyClaimInfo>();
  const chainId = useChainId();
  const client = usePublicClient();
  const { data: wallet } = useWalletClient();
  const contract = { address: getZTFContract(chainId), abi: ZTF_ABI };

  //const [bountyId, _setBountyId] = useState<number>();
  //const setBountyId = useCallback(
  //_.debounce((id: number) => _setBountyId(id), 1000),
  //[]
  //);
  //useEffect(() => {
  //const bid = watch("bountyId");
  //if (bid && !isNaN(bid)) setBountyId(bid);
  //}, [watch("bountyId")]);
  //const { data } = useContractRead({
  //...contract,
  //functionName: "bountyList",
  //args: [BigInt(bountyId ?? 0)],
  //});
  //const bounty = useMemo(
  //() =>
  //data
  //? bountyFromContractData({ index: bountyId ?? 0, ...data })
  //: undefined,
  //[data]
  //);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isClaiming, setIsClaiming] = useState(false);

  const onSubmit = async (data: BountyClaimInfo) => {
    try {
      setIsClaiming(true);
      const { request } = await client.simulateContract({
        ...contract,
        account: wallet?.account.address,
        functionName: "claim",
        args: [
          BigInt(data.bountyId),
          {
            claimer: data.claimer,
            txs_hash: data.txsHash,
            postStateDigest: data.postStateDigest,
            seal: data.seal,
          },
        ],
      });
      const hash = await wallet?.writeContract(request);
      if (!hash) return;
      const tx = await client.waitForTransactionReceipt({
        hash,
      });
      if (tx.status === "success") {
        onOpen();
        reset();
      }
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <>
      <AppHeader title="Claim Bounty" />
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Bounty Claimed!</ModalHeader>
          <ModalBody>
            <Stack spacing={4}>
              <Button w="full" onClick={onClose}>
                Back
              </Button>
            </Stack>
          </ModalBody>
        </ModalContent>
      </Modal>
      <Section>
        <Navbar />
        <Stack spacing={4}>
          <Heading>Claim Bounty</Heading>
          <SetupDetails />
          <HStack justify="space-between">
            <Heading fontSize="2xl">Claim Bounty</Heading>
            <IconButton
              size="sm"
              variant="outline"
              aria-label="Clear"
              icon={<Icon as={FaTrashCan} />}
              isDisabled={!isDirty}
              onClick={() => reset()}
            />
          </HStack>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={4}>
              <InputField
                title="Bounty ID"
                description="The id of the bounty to claim."
                inputProps={{
                  ...register("bountyId", {
                    required: true,
                    setValueAs: (v) => parseInt(v),
                    validate: (v) => !isNaN(Number(v)) || "Invalid amount",
                  }),
                  placeholder: "12",
                }}
                error={errors.bountyId}
              />
              <InputField
                title="Claimer Address"
                description="Address of bounty payment recipient. This address should match submitter address in the zk proof."
                inputProps={{
                  ...register("claimer", {
                    required: true,
                    validate: (v) =>
                      /0x[0-9a-fA-F]{40}/.test(v) ? true : "Invalid address",
                  }),
                  placeholder: "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6",
                }}
                error={errors.claimer}
              />
              <InputField
                title="Transactions Sequence Hash"
                description="Hash of the transactions sequence. This hash should match the one in the zk proof."
                inputProps={{
                  ...register("txsHash", {
                    required: true,
                    validate: (v) =>
                      /0x[0-9a-fA-F]{64}/.test(v) ? true : "Invalid hex",
                  }),
                  placeholder:
                    "0x17436af7b3d1fe3b4f49ebcc7e48c0a7045ae86c9012a013032768b2f1a0bf56",
                }}
                error={errors.txsHash}
              />
              <InputField
                title="Post State Digest"
                description="Hash of the zkvm system's post state after execution. This hash should match the one generated along with zk proof."
                inputProps={{
                  ...register("postStateDigest", {
                    required: true,
                    validate: (v) =>
                      /0x[0-9a-fA-F]{64}/.test(v) ? true : "Invalid hex",
                  }),
                  placeholder:
                    "0x17436af7b3d1fe3b4f49ebcc7e48c0a7045ae86c9012a013032768b2f1a0bf56",
                }}
                error={errors.postStateDigest}
              />
              <InputField
                title="Seal"
                description="Groth16 proof's seal. This is `a`, `b`, `c`, and `delta` concatenated together."
                inputProps={{
                  ...register("seal", {
                    required: true,
                    validate: (v) =>
                      (v.startsWith("0x") && v.length === 514) ||
                      "Invalid seal",
                  }),
                  placeholder: "0x...",
                }}
                error={errors.seal}
              />
            </Stack>
            <Stack
              justify="center"
              py={8}
              direction={{ base: "column", md: "row" }}
            >
              <Button isDisabled={!wallet} isLoading={isClaiming} type="submit">
                Claim Bounty
              </Button>
            </Stack>
          </form>
        </Stack>
      </Section>
    </>
  );
};

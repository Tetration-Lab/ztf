import { InfoSection } from "@/components/Section/InfoSection";
import { AppHeader, Navbar, Section } from "@/components/common";
import { ONEDARK_COLOR_PROPS } from "@/constants/colors";
import { ERC20_ABI, ZTF_ABI, getZTFContract } from "@/constants/contracts";
import {
  CURRENCY_BY_CHAIN_ID,
  ZERO_ADDRESS,
  getDecimal,
  getDenom,
} from "@/constants/currency";
import { ENV_FLAG_INFO } from "@/constants/texts";
import { highlight } from "@/utils/json";
import {
  Button,
  Code,
  HStack,
  Heading,
  Icon,
  IconButton,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  Stack,
  Text,
  chakra,
  useDisclosure,
} from "@chakra-ui/react";
import _ from "lodash";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { FaTrashCan } from "react-icons/fa6";
import { Address, Hex, decodeEventLog, formatUnits, parseUnits } from "viem";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import { default as NextLink } from "next/link";
import { InputField } from "@/components/Input/InputField";
import { getChain, web3Modal } from "@/constants/web3";
import { ADDRESS_REGEX, BYTES32_REGEX, IPFS_CID_REGEX } from "@/utils/string";

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
        title="Understanding CTF Environment"
        description="The CTF environment includes all the EVM bytecode, the contract ABI, the contract address, the target condition and etc. This will be used to simulate the transaction, and to verify against in the end."
        steps={[
          ...ENV_FLAG_INFO.map((e, i) => (
            <Text key={i}>
              <chakra.span as="b">{e.title}:</chakra.span> {e.description}
            </Text>
          )),
          <Code
            w="full"
            whiteSpace="pre-wrap"
            sx={{
              ...ONEDARK_COLOR_PROPS,
            }}
            dangerouslySetInnerHTML={{
              __html: highlight(`{
  "spec": "...",
  "block_config": { ... },
  "target_condition": { ... },
  "allowed_accounts": [...],
  "accounts": { ... },
  "storage": { ... }
}`),
            }}
          />,
        ]}
      />
      <InfoSection
        index={3}
        title="Generate CTF Environment"
        description="Generate a CTF environment to be used in the bounty."
        steps={[
          "In the `lib` package, look for `Environment` struct. This struct contains all the information needed to generate a CTF environment.",
          "Construct the `Environment` struct with the `new` or `builder` method.",
          <Code w="full">
            let env = Environment::new(// fields in here //);
          </Code>,
          <Code w="full">
            let env = Environment::builder().// builder method here //.build();
          </Code>,
          "Call the `hash` method to generate the environment hash. We need to submit this hash to the contract to let bounty's transaction to verify against.",
          <Code w="full">let hash = env.hash();</Code>,
          "Export the environment to a JSON file. We recommend using `std::fs`.",
          <Code w="full">std::fs::write("env.json", env.to_string());</Code>,
          "Wrap that environment object with `environment` key, and optionally add `links` key to include the links to other documentation or source code.",
          "Final JSON file should look something like this,",
          <Code
            w="full"
            whiteSpace="pre-wrap"
            sx={{
              ...ONEDARK_COLOR_PROPS,
            }}
            dangerouslySetInnerHTML={{
              __html: highlight(`{
  "links": [
    {
      "title": "...",
      "description": "...",
      "url": "..."
    }
  ],
  "environment": {
    "spec": "...",
    "block_config": { ... },
    "target_condition": { ... },
    "allowed_accounts": [...],
    "accounts": { ... },
    "storage": { ... }
  }
}`),
            }}
          />,
          "Finally, upload such file to IPFS and get the CID, this CID is needed to create the bounty.",
        ]}
      />
    </>
  );
};

interface BountyInfo {
  currency: Address;
  amount: number;
  title: string;
  ipfsHash: string;
  envHash: Hex;
  callback?: Address;
}

export const CreatePage = () => {
  const {
    register,
    formState: { errors, isDirty },
    setError,
    handleSubmit,
    reset,
    watch,
  } = useForm<BountyInfo>();

  const [isApproved, setIsApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const chainId = useChainId();
  const chain = getChain(chainId);
  const client = usePublicClient();
  const { data: wallet } = useWalletClient();
  const { isConnected } = useAccount();
  const contract = { address: getZTFContract(chainId), abi: ZTF_ABI };

  const availableTokens = CURRENCY_BY_CHAIN_ID[chainId] ?? [];

  const amount = useMemo(() => {
    const amount = watch("amount");
    return isNaN(amount)
      ? 0n
      : parseUnits(_.toString(watch("amount")), getDecimal(watch("currency")));
  }, [watch("amount"), watch("currency")]);

  const onSubmit = async (data: BountyInfo) => {
    if (!isApproved) {
      try {
        setIsApproving(true);
        const amount = await client.readContract({
          address: data.currency,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [wallet?.account.address!],
        });
        if (amount < data.amount) {
          setError("amount", {
            type: "validate",
            message: `Insufficient balance, found ${formatUnits(
              amount,
              getDecimal(data.currency)
            )} but need ${data.amount}`,
          });
          return;
        }
        const approval = await client.readContract({
          address: data.currency,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [wallet?.account.address!, contract.address],
        });
        if (approval >= amount) {
          setIsApproved(true);
          return;
        }
        const { request } = await client.simulateContract({
          address: data.currency,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [contract.address, amount],
        });
        const hash = await wallet?.writeContract(request);
        if (!hash) return;
        const tx = await client.waitForTransactionReceipt({
          hash,
        });
        if (tx.status === "success") setIsApproved(true);
      } finally {
        setIsApproving(false);
      }
    } else {
      try {
        setIsCreating(true);
        const { request } = await client.simulateContract({
          ...contract,
          account: wallet?.account.address,
          functionName: "newBounty",
          args: [
            ZERO_ADDRESS,
            data.callback || ZERO_ADDRESS,
            data.currency,
            amount,
            data.title,
            data.ipfsHash,
            data.envHash as Hex,
          ],
        });
        const hash = await wallet?.writeContract(request);
        if (!hash) return;
        const tx = await client.waitForTransactionReceipt({
          hash,
        });
        if (tx.status === "success" && tx.logs.length > 0) {
          const {
            args: { bountyID },
          } = decodeEventLog({
            abi: ZTF_ABI,
            eventName: "NewBounty",
            ...tx.logs[tx.logs.length - 1],
          });
          setBountyId(Number(bountyID));
          onOpen();
          reset();
          setIsApproved(false);
        }
      } finally {
        setIsCreating(false);
      }
    }
  };

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [bountyId, setBountyId] = useState(0);

  return (
    <>
      <AppHeader title="Create Bounty" />
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Bounty Created!</ModalHeader>
          <ModalBody>
            <Stack spacing={4}>
              <Text>Bounty created at id {bountyId}.</Text>
              <Button
                w="full"
                as={NextLink}
                href={`/bounty/${bountyId}`}
                onClick={onClose}
              >
                Go To Bounty Page
              </Button>
            </Stack>
          </ModalBody>
        </ModalContent>
      </Modal>
      <Section>
        <Navbar />
        <Stack spacing={4}>
          <Heading>Create Bounty</Heading>
          <Text wordBreak="break-all" fontSize="lg">
            Contract lived in <chakra.span as="b">{chain?.name}</chakra.span> at{" "}
            <chakra.span
              bg="gray.500"
              fontFamily="Fira Code"
              as={Link}
              isExternal
              href={`${chain?.blockExplorers?.default.url}/address/${contract.address}`}
            >
              {contract.address}
            </chakra.span>
          </Text>
          <SetupDetails />
          <HStack justify="space-between">
            <Heading fontSize="2xl">Create Bounty</Heading>
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
                title="Title"
                description="The title of the bounty, will be shown in the bounty list."
                inputProps={{
                  ...register("title", {
                    required: true,
                    maxLength: 40,
                  }),
                  placeholder: "Pwn Me If You Can!",
                  maxLength: 40,
                }}
                error={errors.title}
              />
              <InputField
                title="Environment Hash"
                description="The hash of the environment, will be used to verify the bounty
                  validity proof. Must starts with `0x...`"
                inputProps={{
                  ...register("envHash", {
                    required: true,
                    validate: (v) =>
                      BYTES32_REGEX.test(v) ? true : "Invalid hash",
                  }),
                  placeholder:
                    "0x2d6d931eaafbf58c5d639623ef1e19e626ffb3e9bdc0a6ee5a4da5879ddcb325",
                  maxLength: 66,
                }}
                error={errors.envHash}
              />
              <InputField
                title="IPFS CID"
                description="The CID of the environment JSON file, will be used to display and fetch the environment setup. Must starts with `Qm...`"
                inputProps={{
                  ...register("ipfsHash", {
                    required: true,
                    validate: (v) =>
                      IPFS_CID_REGEX.test(v) ? true : "Invalid CID",
                  }),
                  placeholder: "QmUhguprqR9wCh6k1f9q8SDymxffxksr6XKR1m2iTgBWGR",
                  maxLength: 46,
                }}
                error={errors.ipfsHash}
              />
              <InputField
                title="Currency"
                description="The currency to be used in the bounty. Must be a valid ERC20 token address. Must starts with `0x...`"
                customInput={
                  <Select
                    {...register("currency", {
                      required: true,
                      validate: (v) =>
                        ADDRESS_REGEX.test(v) ? true : "Invalid address",
                    })}
                    placeholder="Select currency"
                    isInvalid={!!errors.currency}
                  >
                    {availableTokens.map((token) => (
                      <option key={token} value={token}>
                        {getDenom(token)} ({token})
                      </option>
                    ))}
                  </Select>
                }
                error={errors.currency}
              />
              <InputField
                title="Amount"
                description="The amount of currency to be used in the bounty."
                inputProps={{
                  ...register("amount", {
                    required: true,
                    setValueAs: (v) => parseFloat(v),
                    validate: (v) => !isNaN(Number(v)) || "Invalid amount",
                  }),
                  placeholder: "12501.9",
                }}
                error={errors.amount}
              />
              <InputField
                title="Callback Address"
                description="The address to be called when the bounty is claimed. Must starts with `0x...`"
                inputProps={{
                  ...register("callback", {
                    required: false,
                    validate: (v) =>
                      !v || ADDRESS_REGEX.test(v) ? true : "Invalid address",
                  }),
                  placeholder: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead1111",
                }}
                error={errors.callback}
              />
            </Stack>
            <Stack
              justify="center"
              py={8}
              direction={{ base: "column", md: "row" }}
            >
              {!isConnected ? (
                <Button onClick={() => web3Modal.open()}>Connect Wallet</Button>
              ) : (
                <>
                  <Button
                    isDisabled={isApproved}
                    isLoading={isApproving}
                    type="submit"
                  >
                    Approve Bounty Payment
                  </Button>
                  <Button
                    isDisabled={!isApproved}
                    isLoading={isCreating}
                    type="submit"
                  >
                    Create Bounty
                  </Button>
                </>
              )}
            </Stack>
          </form>
        </Stack>
      </Section>
    </>
  );
};

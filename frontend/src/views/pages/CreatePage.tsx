import { InfoSection } from "@/components/Section/InfoSection";
import { AppHeader, Navbar, Section } from "@/components/common";
import { MOCK_CONTRACT_ADDRESS } from "@/constants/mocks";
import { ENV_FLAG_INFO } from "@/constants/texts";
import { chain } from "@/constants/web3";
import {
  Button,
  Code,
  HStack,
  Heading,
  Icon,
  IconButton,
  Input,
  InputProps,
  Link,
  Stack,
  Text,
  chakra,
} from "@chakra-ui/react";
import _ from "lodash";
import { useState } from "react";
import { FieldError, useForm } from "react-hook-form";
import { FaTrashCan } from "react-icons/fa6";
import { Address } from "viem";

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
        steps={ENV_FLAG_INFO.map((e, i) => (
          <Text key={i}>
            <chakra.span as="b">{e.title}:</chakra.span> {e.description}
          </Text>
        ))}
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
          "Upload the environment in JSON file to IPFS and get the CID, this CID is needed to create the bounty.",
        ]}
      />
    </>
  );
};

const InputField = ({
  title,
  description,
  inputProps,
  error,
}: {
  title: string;
  description: string;
  inputProps: InputProps;
  error?: FieldError;
}) => {
  return (
    <Stack spacing={2}>
      <Stack
        direction={{ base: "column", md: "row" }}
        align={{ base: "start", md: "center" }}
        spacing={{ base: 2, md: 4 }}
      >
        <Stack spacing={0} w={{ base: "full", md: "lg" }}>
          <Text fontWeight="bold" fontSize="lg">
            {title}
          </Text>
          <Text color="gray.200" lineHeight={1.1}>
            {description}
          </Text>
        </Stack>

        <Stack w="full">
          <Input {...inputProps} isInvalid={!!error} />
          {error && (
            <Text
              as="b"
              color="error"
              position="absolute"
              transform="auto"
              translateY="170%"
              zIndex={1}
            >
              {error.type === "validate"
                ? error?.message ?? "Error"
                : _.startCase(error.type)}
            </Text>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
};

interface BountyInfo {
  currency: Address;
  amount: number;
  title: string;
  ipfsHash: string;
  envHash: string;
}

export const CreatePage = () => {
  const {
    register,
    formState: { errors, isDirty },
    handleSubmit,
    reset,
  } = useForm<BountyInfo>();

  const [isApproved, setIsApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const onSubmit = (data: BountyInfo) => {
    if (!isApproved) {
      console.log("Approving...", data);
    } else {
      console.log("Creating...", data);
    }
  };

  return (
    <>
      <AppHeader title="Create Bounty" />
      <Section>
        <Navbar />
        <Stack spacing={4}>
          <Heading>Create Bounty</Heading>
          <Text wordBreak="break-all" fontSize="lg">
            Contract lived in <chakra.span as="b">{chain.name}</chakra.span> at{" "}
            <chakra.span
              bg="gray.500"
              fontFamily="Fira Code"
              as={Link}
              isExternal
              href={`${chain.blockExplorers.default.url}/address/${MOCK_CONTRACT_ADDRESS}`}
            >
              {MOCK_CONTRACT_ADDRESS.toLowerCase()}
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
                      /0x[0-9a-fA-F]{64}/g.test(v) ? true : "Invalid hash",
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
                      /Qm[1-9A-HJ-NP-Za-km-z]{44}/g.test(v)
                        ? true
                        : "Invalid CID",
                  }),
                  placeholder: "QmUhguprqR9wCh6k1f9q8SDymxffxksr6XKR1m2iTgBWGR",
                  maxLength: 46,
                }}
                error={errors.ipfsHash}
              />
              <InputField
                title="Currency"
                description="The currency to be used in the bounty. Must be a valid ERC20 token address. Must starts with `0x...`"
                inputProps={{
                  ...register("currency", {
                    required: true,
                    validate: (v) =>
                      /0x[0-9a-fA-F]{20}/g.test(v) ? true : "Invalid address",
                  }),
                  placeholder: "0x628ebc64a38269e031afbdd3c5ba857483b5d048",
                  maxLength: 22,
                }}
                error={errors.currency}
              />
              <InputField
                title="Amount"
                description="The amount of currency to be used in the bounty."
                inputProps={{
                  ...register("amount", {
                    required: true,
                  }),
                  placeholder: "12501.9",
                  type: "number",
                }}
                error={errors.amount}
              />
            </Stack>
            <Stack
              justify="center"
              py={8}
              direction={{ base: "column", md: "row" }}
            >
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
            </Stack>
          </form>
        </Stack>
      </Section>
    </>
  );
};

import { AppHeader, Navbar, Section } from "@/components/common";
import {
  Box,
  HStack,
  Heading,
  Image,
  SimpleGrid,
  Stack,
  Text,
  Wrap,
} from "@chakra-ui/react";

export const AboutPage = () => {
  return (
    <>
      <AppHeader title="About" />
      <Section>
        <Navbar />
        <Stack spacing={4}>
          <Heading>About</Heading>
          <Stack align="center" justify="center">
            <Image src="/images/diagram.png" alt="Protocol Diagram" />
            <Text>Image 1: Protocol Diagram</Text>
          </Stack>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Stack>
              <Heading fontSize="2xl">🧑‍🔧 Bounty Creator</Heading>
              <Text>Bounty can be put up by providing</Text>
              <Text>
                - Flag contract which will emit `Captured` event on condition
                (Fully programmable as long as its in EVM capability), which
                implements the `IFlag` interface.
              </Text>
              <Text>- Payment for bounty (ERC20-Compatible).</Text>
              <Text>
                - Callback target that implements the `ICallback` interface*.
              </Text>
              <Text as="i">
                * This callback can implement any function (e.g. pause protocol,
                additional payout based on % of TVL, etc).
              </Text>
              <Text>
                - Environment config state (We only support sandbox environment
                for this version).
              </Text>
              <Text>- General info (Bounty name, related links, etc).</Text>
            </Stack>
            <Stack>
              <Heading fontSize="2xl">🥷 White Hat Hacker</Heading>
              <Text>
                White hat hacker can claim bounty by proving a valid proof of
                vulnerability
              </Text>
              <Text>
                - Find target bounty on ZTF website (or fetch from ZTF contract
                on-chain).
              </Text>
              <Text>- Setup bounty environment.</Text>
              <Text>
                - Create an attack transactions sequence which triggers the
                `Captured` event.
              </Text>
              <Text>
                - Generate the STARK proof of such transactions sequence.
              </Text>
              <Text>
                - Use Bonsai's API to convert STARK proof to Groth16's SNARK
                proof.
              </Text>
              <Text>
                - Submit the SNARK proof to ZTF contract to claim the bounty.
              </Text>
            </Stack>
          </SimpleGrid>
          <Box h={8} />
        </Stack>
      </Section>
    </>
  );
};

import { Box, Text, Heading, Stack } from "@chakra-ui/react";
import { Section, Navbar, Footer } from "@/components/common";

export const HomePage = () => {
  return (
    <>
      <Section>
        <Navbar />
        <Stack>
          <Heading>ZTF</Heading>
          <Text>
            On-chain ctf with claimable bounty using zero-knowledge proof
          </Text>
        </Stack>
        <Footer />
      </Section>
    </>
  );
};

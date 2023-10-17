import { AppHeader, Navbar, Section } from "@/components/common";
import { Heading, Stack } from "@chakra-ui/react";

export const AboutPage = () => {
  return (
    <>
      <AppHeader title="About" />
      <Section>
        <Navbar />
        <Stack spacing={2}>
          <Heading>About</Heading>
        </Stack>
      </Section>
    </>
  );
};

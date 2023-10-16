import {
  Text,
  Heading,
  Stack,
  Wrap,
  Divider,
  HStack,
  IconButton,
  Spacer,
  Link,
} from "@chakra-ui/react";
import { Section, Navbar, Footer } from "@/components/common";
import { ValueCard } from "@/components/Card/ValueCard";
import { MOCK_BOUNTIES } from "@/constants/mocks";
import { BountyCard } from "@/components/Card/BountyCard";
import { useEffect, useState } from "react";
import { Bounty } from "@/interfaces/bounty";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
} from "@chakra-ui/icons";

export const HomePage = () => {
  const PAGE_SIZE = 10;
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [isExhausted, setIsExhausted] = useState(false);
  const [bounties, setBounties] = useState<Bounty[]>([]);

  useEffect(() => {
    const load = async () => {
      if (isLoading) return;
      setIsLoading(true);
      const currentBounty = MOCK_BOUNTIES.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
      );
      if (currentBounty.length === 0) {
        setIsExhausted(true);
        setPage((p) => p - 1);
      } else {
        setBounties(currentBounty);
      }
      setIsLoading(false);
    };

    load();
  }, [page]);

  return (
    <>
      <Section>
        <Navbar />
        <Stack>
          <Heading>ZTF</Heading>
          <Text>
            On-chain ctf with claimable bounty using zero-knowledge proof
          </Text>
          <Text as="i">
            Made with love by{" "}
            <Link href="https://www.tetrationlab.com/" isExternal>
              Tetration Lab <ExternalLinkIcon boxSize="12px" />
            </Link>{" "}
            team!
          </Text>
          <Wrap py={2}>
            <ValueCard title="Available Bounty" value={139} />
            <ValueCard title="Available ETH" value={100230} isEth />
            <ValueCard title="Claimed Bounty" value={20} />
            <ValueCard title="Claimed ETH" value={399} isEth />
          </Wrap>
          <Divider my={4} />
          <HStack justify="space-between">
            <Heading fontSize="3xl">Bounties</Heading>
            <HStack>
              <IconButton
                icon={<ChevronLeftIcon />}
                aria-label="back"
                isDisabled={page == 1}
                onClick={() => setPage((p) => p - 1)}
              />
              <IconButton
                icon={<ChevronRightIcon />}
                aria-label="next"
                isDisabled={isExhausted}
                onClick={() => setPage((p) => p + 1)}
              />
            </HStack>
          </HStack>
          <Wrap py={2}>
            {bounties.map((b, i) => (
              <BountyCard key={i} {...b} />
            ))}
          </Wrap>
        </Stack>
        <Footer />
      </Section>
    </>
  );
};

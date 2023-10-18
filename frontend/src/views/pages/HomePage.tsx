import {
  Text,
  Heading,
  Stack,
  Wrap,
  Divider,
  HStack,
  IconButton,
  Link,
  Image,
  Button,
} from "@chakra-ui/react";
import { Section, Navbar, Footer, AppHeader } from "@/components/common";
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
import { useAccount, useChainId, useSwitchNetwork } from "wagmi";
import { chains, web3Modal } from "@/constants/web3";

export const HomePage = () => {
  const {
    switchNetwork,
    isLoading: isSwitching,
    pendingChainId,
  } = useSwitchNetwork();
  const { isConnected } = useAccount();
  const chainId = useChainId();

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
      <AppHeader title="Bounties" />
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
          <Stack>
            <Text fontSize="lg">Supported Chains</Text>
            <Wrap spacingX={2}>
              {chains.map((c, i) => (
                <Button
                  key={i}
                  as={Button}
                  gap={2}
                  isLoading={isSwitching && pendingChainId === c.id}
                  isActive={isConnected && chainId === c.id}
                  onClick={async () => {
                    if (!isConnected || !switchNetwork) web3Modal.open();
                    else switchNetwork(c.id);
                  }}
                >
                  <Image key={i} src={c.image} boxSize="24px" />
                  <Text as="b">{c.name}</Text>
                </Button>
              ))}
            </Wrap>
          </Stack>
          <Wrap py={2}>
            <ValueCard title="Available Bounty" value={139} />
            <ValueCard title="Available" value={100230} valuePrefix="$" />
            <ValueCard title="Claimed Bounty" value={20} />
            <ValueCard title="Claimed" value={399} valuePrefix="$" />
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

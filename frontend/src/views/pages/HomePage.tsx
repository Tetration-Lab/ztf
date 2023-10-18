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
  Skeleton,
} from "@chakra-ui/react";
import { Section, Navbar, Footer, AppHeader } from "@/components/common";
import { ValueCard } from "@/components/Card/ValueCard";
import { BountyCard } from "@/components/Card/BountyCard";
import { useMemo, useState } from "react";
import { bountyFromContractData } from "@/interfaces/bounty";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
} from "@chakra-ui/icons";
import {
  useAccount,
  useChainId,
  useContractRead,
  useContractReads,
  useSwitchNetwork,
} from "wagmi";
import { chains, web3Modal } from "@/constants/web3";
import { ZTF_ABI, getZTFContract } from "@/constants/contracts";
import { usePrices } from "@/stores/usePrices";
import { getDecimal, getDenom } from "@/constants/currency";
import { formatUnits } from "viem";
import _ from "lodash";

export const HomePage = () => {
  const {
    switchNetwork,
    isLoading: isSwitching,
    pendingChainId,
  } = useSwitchNetwork();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const contract = { address: getZTFContract(chainId), abi: ZTF_ABI };

  const { getPrice, usd } = usePrices();

  const { data, isLoading: isLoadingStats } = useContractReads({
    contracts: [
      {
        ...contract,
        functionName: "numBounty",
      },
      {
        ...contract,
        functionName: "numClaimed",
      },
      {
        ...contract,
        functionName: "getAssetStatPage",
        args: [2n, 0n],
      },
    ],
  });

  const bountyPrize = useMemo(() => {
    const assets = data?.[2]?.result;
    var total = 0;
    var claimed = 0;
    assets?.forEach((a) => {
      const denom = getDenom(a.asset);
      const decimal = getDecimal(a.asset);
      const price = getPrice(denom);
      total += Number(formatUnits(a.total, decimal)) * price;
      claimed += Number(formatUnits(a.claimed, decimal)) * price;
    });
    return [total, claimed] as const;
  }, [data?.[2], usd]);

  const PAGE_SIZE = 10n;
  const [page, setPage] = useState(0);
  const {
    data: bounties,
    isLoading,
    isError,
  } = useContractRead({
    ...contract,
    functionName: "getBountyPage",
    args: [PAGE_SIZE, BigInt(page) * PAGE_SIZE],
  });

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
                  cursor={chainId === c.id ? "default" : "pointer"}
                  onClick={
                    isSwitching || chainId === c.id
                      ? undefined
                      : async () => {
                          if (!isConnected || !switchNetwork) web3Modal.open();
                          else switchNetwork(c.id);
                        }
                  }
                >
                  <Image key={i} src={c.image} boxSize="24px" />
                  <Text as="b">{c.name}</Text>
                </Button>
              ))}
            </Wrap>
          </Stack>
          <Wrap py={2}>
            <ValueCard
              title="Available Bounty"
              value={Number(data?.[0]?.result)}
              isLoading={isLoadingStats}
            />
            <ValueCard
              title="Total"
              value={bountyPrize[0]}
              valuePrefix="$"
              isLoading={isLoadingStats}
            />
            <ValueCard
              title="Claimed Bounty"
              value={Number(data?.[1]?.result)}
              isLoading={isLoadingStats}
            />
            <ValueCard
              title="Claimed"
              value={bountyPrize[1]}
              valuePrefix="$"
              isLoading={isLoadingStats}
            />
          </Wrap>
          <Divider my={4} />
          <HStack justify="space-between">
            <Heading fontSize="3xl">Bounties</Heading>
            <HStack>
              <IconButton
                icon={<ChevronLeftIcon />}
                aria-label="back"
                isDisabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              />
              <IconButton
                icon={<ChevronRightIcon />}
                aria-label="next"
                isDisabled={isError}
                onClick={() => setPage((p) => p + 1)}
              />
            </HStack>
          </HStack>
          <Wrap py={2}>
            {isLoading
              ? _.range(10).map((i) => <Skeleton key={i} w="2xs" h="xs" />)
              : bounties?.map((b, i) => (
                  <BountyCard
                    key={i}
                    {...bountyFromContractData({ index: i, ...b })}
                  />
                ))}
          </Wrap>
        </Stack>
        <Footer />
      </Section>
    </>
  );
};

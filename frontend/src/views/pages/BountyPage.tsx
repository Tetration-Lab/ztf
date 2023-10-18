import { EnvironmentCard } from "@/components/Card/EnvironmentCard";
import { EnvironmentFlagCard } from "@/components/Card/EnvironmentFlagCard";
import { ExternalLinkCard } from "@/components/Card/ExternalLinkCard";
import { AppHeader, Navbar, Section } from "@/components/common";
import { ZTF_ABI, getZTFContract } from "@/constants/contracts";
import { getDenom } from "@/constants/currency";
import { ENV_FLAG_INFO } from "@/constants/texts";
import { bountyFromContractData } from "@/interfaces/bounty";
import { usePrices } from "@/stores/usePrices";
import { formatAddress } from "@/utils/address";
import { fetchBountyDetailIpfs } from "@/utils/ipfs";
import {
  Badge,
  Collapse,
  HStack,
  Heading,
  Icon,
  IconButton,
  Skeleton,
  Stack,
  Text,
  Wrap,
  useDisclosure,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import _ from "lodash";
import { useRouter } from "next/router";
import numbro from "numbro";
import { useMemo } from "react";
import { FaChevronDown } from "react-icons/fa";
import { useChainId, useContractRead, useEnsName } from "wagmi";

export const BountyPage = () => {
  const {
    query: { id },
  } = useRouter();
  const { getPrice } = usePrices();
  const envFlagDisclosure = useDisclosure({ defaultIsOpen: true });

  const chainId = useChainId();
  const { data, isLoading } = useContractRead({
    address: getZTFContract(chainId),
    abi: ZTF_ABI,
    functionName: "bountyList",
    args: [BigInt(Number(id) || 0)],
  });
  const { data: ens } = useEnsName({
    address: data?.owner,
  });
  const bounty = useMemo(
    () =>
      data
        ? bountyFromContractData({ index: Number(id) || 0, ...data })
        : undefined,
    [data]
  );

  const detail = useQuery({
    queryKey: ["bountyDetail", bounty?.ipfsHash],
    queryFn: async () => {
      if (!bounty?.ipfsHash) return null;
      return await fetchBountyDetailIpfs(bounty?.ipfsHash);
    },
  });

  return (
    <>
      <AppHeader title={`Bounty: ${bounty?.title}`} />
      <Section>
        <Navbar />
        <Stack spacing={2}>
          <Skeleton isLoaded={!!bounty && !isLoading}>
            <HStack justify="space-between" spacing={{ base: 2, md: 10 }}>
              <Stack spacing={0}>
                <Heading maxW="3xl">Bounty: {bounty?.title}</Heading>
                <Badge
                  w="fit-content"
                  colorScheme={bounty?.isClaimed ? "red" : "green"}
                  fontSize="xl"
                >
                  {bounty?.isClaimed ? "Claimed" : "Available"}
                </Badge>
              </Stack>
              <Stack align="end" spacing={0}>
                <Heading>
                  {numbro(bounty?.amount!).format({
                    average: true,
                    mantissa: 2,
                    trimMantissa: true,
                  })}
                  {getDenom(bounty?.currency!)}
                </Heading>
                <Text fontSize="xl" color="gray.300">
                  ~$
                  {numbro(
                    bounty?.amount! * getPrice(getDenom(bounty?.currency!))
                  ).format({
                    average: true,
                    mantissa: 2,
                    trimMantissa: true,
                  })}
                </Text>
              </Stack>
            </HStack>
          </Skeleton>
          <Skeleton isLoaded={!!bounty && !isLoading} as={Stack} spacing={0}>
            <Text>ID: {bounty?.id}</Text>
            <Text display={{ base: "none", md: "block" }}>
              Owner: {ens ?? bounty?.owner.toLowerCase()}
            </Text>
            <Text display={{ base: "block", md: "none" }}>
              Owner: {ens ?? formatAddress(bounty?.owner.toLowerCase()!)}
            </Text>
            <Text>
              Last Updated: {bounty?.lastUpdated.toLocaleDateString()}
            </Text>
          </Skeleton>
          <Heading fontSize="2xl">Related Links</Heading>
          <Wrap py={2}>
            {detail.isLoading || !detail.data
              ? _.range(3).map((i) => <Skeleton key={i} h="128px" w="xs" />)
              : detail.data?.links?.map((link, i) => (
                  <ExternalLinkCard key={i} {...link} />
                ))}
          </Wrap>
          <Heading fontSize="2xl">CTF Execution Environment</Heading>
          <HStack>
            <Heading fontSize="xl">Environment Flag Info</Heading>
            <IconButton
              size="sm"
              icon={
                <Icon
                  as={FaChevronDown}
                  transform={envFlagDisclosure.isOpen ? "rotate(180deg)" : ""}
                  transition="transform 0.2s ease-in-out"
                />
              }
              aria-label={"Expand Info"}
              onClick={envFlagDisclosure.onToggle}
            />
          </HStack>
          <Collapse in={envFlagDisclosure.isOpen} animateOpacity>
            <Wrap py={2}>
              {ENV_FLAG_INFO.map((info, i) => (
                <EnvironmentFlagCard key={i} {...info} />
              ))}
            </Wrap>
          </Collapse>
          {detail.isLoading || !detail.data ? (
            <Skeleton my={2} h="lg" w="full" />
          ) : (
            <EnvironmentCard environment={detail.data?.environment} />
          )}
        </Stack>
      </Section>
    </>
  );
};

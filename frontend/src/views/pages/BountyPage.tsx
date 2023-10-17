import { EnvironmentCard } from "@/components/Card/EnvironmentCard";
import { EnvironmentFlagCard } from "@/components/Card/EnvironmentFlagCard";
import { ExternalLinkCard } from "@/components/Card/ExternalLinkCard";
import { AppHeader, Navbar, Section } from "@/components/common";
import { getDenom } from "@/constants/currency";
import { MOCK_BOUNTIES } from "@/constants/mocks";
import { ENV_FLAG_INFO } from "@/constants/texts";
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
import { FaChevronDown } from "react-icons/fa";

export const BountyPage = () => {
  const {
    query: { id },
  } = useRouter();
  const { getPrice } = usePrices();
  const envFlagDisclosure = useDisclosure({ defaultIsOpen: true });

  const bounty = useQuery({
    queryKey: ["bounty", id],
    queryFn: async () => {
      return MOCK_BOUNTIES.find((b) => b.id === id) || null;
    },
  });

  const detail = useQuery({
    queryKey: ["bountyDetail", bounty.data?.ipfsHash],
    queryFn: async () => {
      if (!bounty.data?.ipfsHash) return null;
      return await fetchBountyDetailIpfs(bounty.data?.ipfsHash);
    },
  });

  return (
    <>
      <AppHeader title={`Bounty ${bounty.data?.title}`} />
      <Section>
        <Navbar />
        <Stack spacing={2}>
          <Skeleton isLoaded={!!bounty.data && !bounty.isLoading}>
            <HStack justify="space-between" spacing={{ base: 2, md: 10 }}>
              <Stack spacing={0}>
                <Heading maxW="3xl">Bounty {bounty.data?.title}</Heading>
                <Badge
                  w="fit-content"
                  colorScheme={bounty.data?.isClaimed ? "red" : "green"}
                  fontSize="xl"
                >
                  {bounty.data?.isClaimed ? "Claimed" : "Available"}
                </Badge>
              </Stack>
              <Stack align="end" spacing={0}>
                <Heading>
                  {numbro(bounty.data?.amount!).format({
                    average: true,
                    mantissa: 2,
                    trimMantissa: true,
                  })}
                  {getDenom(bounty.data?.currency!)}
                </Heading>
                <Text fontSize="xl" color="gray.300">
                  ~$
                  {numbro(
                    bounty.data?.amount! *
                      getPrice(getDenom(bounty.data?.currency!))
                  ).format({
                    average: true,
                    mantissa: 2,
                    trimMantissa: true,
                  })}
                </Text>
              </Stack>
            </HStack>
          </Skeleton>
          <Skeleton
            isLoaded={!!bounty.data && !bounty.isLoading}
            as={Stack}
            spacing={0}
          >
            <Text>ID: {bounty.data?.id}</Text>
            <Text display={{ base: "none", md: "block" }}>
              Owner: {bounty.data?.owner.toLowerCase()}
            </Text>
            <Text display={{ base: "block", md: "none" }}>
              Owner: {formatAddress(bounty.data?.owner.toLowerCase()!)}
            </Text>
            <Text>
              Last Updated: {bounty.data?.lastUpdated.toLocaleDateString()}
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

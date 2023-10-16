import { EnvironmentCard } from "@/components/Card/EnvironmentCard";
import { ExternalLinkCard } from "@/components/Card/ExternalLinkCard";
import { Navbar, Section } from "@/components/common";
import { MOCK_BOUNTIES } from "@/constants/mocks";
import { usePrices } from "@/stores/usePrices";
import { fetchBountyDetailIpfs } from "@/utils/ipfs";
import { prettify } from "@/utils/json";
import {
  Badge,
  HStack,
  Heading,
  Skeleton,
  Stack,
  Text,
  Wrap,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import _ from "lodash";
import { useRouter } from "next/router";
import numbro from "numbro";

export const BountyPage = () => {
  const {
    query: { id },
  } = useRouter();
  const { ethUsd } = usePrices();

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
      <Section>
        <Navbar />
        <Stack spacing={2}>
          <Skeleton isLoaded={!!bounty.data?.title}>
            <HStack justify="space-between" spacing={{ base: 2, md: 10 }}>
              <Stack>
                <Heading maxW="3xl">Bounty {bounty.data?.title}</Heading>
                <Badge
                  w="fit-content"
                  colorScheme={bounty.data?.isClaimed ? "red" : "green"}
                  fontSize="xl"
                >
                  {bounty.data?.isClaimed ? "Claimed" : "Available"}
                </Badge>
              </Stack>
              <Stack align="end">
                <Heading>
                  {numbro(bounty.data?.amount!).format({
                    average: true,
                    mantissa: 2,
                    trimMantissa: true,
                  })}
                  eth
                </Heading>
                <Text fontSize="xl">
                  ~$
                  {numbro(bounty.data?.amount! * ethUsd).format({
                    average: true,
                    mantissa: 2,
                    trimMantissa: true,
                  })}
                </Text>
              </Stack>
            </HStack>
          </Skeleton>
          <Heading fontSize="2xl">Related Links</Heading>
          <Wrap py={2}>
            {detail.isLoading
              ? _.range(3).map((i) => <Skeleton key={i} h="128px" w="xs" />)
              : detail.data?.links?.map((link, i) => (
                  <ExternalLinkCard key={i} {...link} />
                ))}
          </Wrap>
          <Heading fontSize="2xl">CTF Execution Environment</Heading>

          {detail.isLoading ? (
            <Skeleton my={2} h="lg" w="full" />
          ) : (
            <EnvironmentCard environment={detail.data?.environment} />
          )}
        </Stack>
      </Section>
    </>
  );
};

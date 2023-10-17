import { getDenom } from "@/constants/currency";
import { Bounty } from "@/interfaces/bounty";
import { usePrices } from "@/stores/usePrices";
import { formatAddress } from "@/utils/address";
import { Badge, Button, Card, Divider, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import numbro from "numbro";

export const BountyCard = ({
  id,
  amount,
  isClaimed,
  lastUpdated,
  owner,
  title,
  currency,
}: Bounty) => {
  const { getPrice } = usePrices();

  return (
    <Card
      p={4}
      as={Stack}
      align="end"
      minW={{ sm: "full", md: "3xs" }}
      maxW="2xs"
      textAlign="end"
      spacing={0}
    >
      <Text as="b" fontSize="lg" noOfLines={2}>
        {title}
      </Text>
      <Text fontSize="sm">
        Last updated: {lastUpdated.toLocaleDateString()}
      </Text>
      <Text color="gray.300" noOfLines={1}>
        By {formatAddress(owner)}
      </Text>
      <Badge colorScheme={isClaimed ? "red" : "green"} fontSize="sm" my={1}>
        {isClaimed ? "Claimed" : "Available"}
      </Badge>
      <Stack
        direction={{ base: "row-reverse", md: "column" }}
        justify="space-between"
        spacing={{ base: 2, md: 0 }}
      >
        <Text as="b" fontSize="2xl" textAlign="end" lineHeight={0.9}>
          {numbro(amount).format({
            average: true,
            mantissa: 2,
            trimMantissa: true,
          })}
          {getDenom(currency)}
        </Text>
        <Text as="b" fontSize="lg" color="gray.300">
          ~$
          {numbro(amount * getPrice(getDenom(currency))).format({
            average: true,
            mantissa: 2,
            trimMantissa: true,
          })}
        </Text>
      </Stack>
      <Divider my={2} opacity={0.1} />
      <Button as={Link} href={`/bounty/${id}`} w="full">
        View Bounty
      </Button>
    </Card>
  );
};

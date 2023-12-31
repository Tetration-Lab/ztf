import { usePrices } from "@/stores/usePrices";
import { Card, Skeleton, Text } from "@chakra-ui/react";
import numbro from "numbro";

interface ValueCardProps {
  title: string;
  description?: string;
  value: number;
  valueSuffix?: string;
  valuePrefix?: string;
  isLoading?: boolean;
}

export const ValueCard = ({
  title,
  description,
  value,
  valuePrefix,
  valueSuffix,
  isLoading,
}: ValueCardProps) => {
  const { getPrice } = usePrices();

  return (
    <Skeleton isLoaded={!isLoading}>
      <Card p={{ base: 2, md: 4 }}>
        <Text>{title}</Text>
        <Text>{description}</Text>
        <Text as="b" fontSize="2xl" textAlign="end">
          {valuePrefix}
          {numbro(value).format({
            average: true,
            mantissa: 2,
            trimMantissa: true,
          })}
          {valueSuffix}
        </Text>
      </Card>
    </Skeleton>
  );
};

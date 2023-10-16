import { Card, Text } from "@chakra-ui/react";
import numbro from "numbro";

interface ValueCardProps {
  title: string;
  description?: string;
  value: number | bigint;
  valueSuffix?: string;
  isEth?: boolean;
}

export const ValueCard = ({ title, description, value }: ValueCardProps) => {
  return (
    <Card p={{ base: 2, md: 4 }}>
      <Text>{title}</Text>
      <Text>{description}</Text>
      <Text as="b" fontSize="2xl" textAlign="end">
        {numbro(value).format({
          average: true,
          mantissa: 2,
          trimMantissa: true,
        })}
      </Text>
    </Card>
  );
};

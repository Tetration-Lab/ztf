import { Box, Card, Heading, Stack, Text } from "@chakra-ui/react";
import { ReactNode } from "react";

interface InfoSectionProps {
  index: number;
  title: string;
  description?: string;
  steps: ReactNode[];
}

export const InfoSection = ({
  index,
  title,
  description,
  steps,
}: InfoSectionProps) => {
  return (
    <Card as={Stack} spacing={2} p={4}>
      <Heading fontSize="xl">
        {index}. {title}
      </Heading>
      {description && (
        <Text as="i" color="gray.200">
          {description}
        </Text>
      )}
      {steps.map((d, i) =>
        typeof d === "string" ? (
          <Text key={i}>{d}</Text>
        ) : (
          <Box key={i}>{d}</Box>
        )
      )}
    </Card>
  );
};

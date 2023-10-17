import { Card, HStack, Icon, Stack, Text } from "@chakra-ui/react";

export const EnvironmentFlagCard = ({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: any;
}) => {
  return (
    <Card p={4} h="fit-content" maxW="xs" minW={{ base: "full", md: "auto" }}>
      <HStack spacing={4}>
        {icon && <Icon as={icon} boxSize={6} />}
        <Stack spacing={0}>
          <Text as="b" fontSize="lg" align="end" noOfLines={1}>
            {title}
          </Text>
          {description && <Text align="end">{description}</Text>}
        </Stack>
      </HStack>
    </Card>
  );
};

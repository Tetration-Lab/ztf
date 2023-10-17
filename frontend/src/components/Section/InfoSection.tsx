import {
  Box,
  Card,
  Collapse,
  HStack,
  Heading,
  Icon,
  IconButton,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { ReactNode } from "react";
import { FaChevronDown } from "react-icons/fa6";

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
  const { isOpen, onToggle } = useDisclosure();
  return (
    <Card as={Stack} spacing={2} p={4}>
      <HStack justify="space-between">
        <Heading fontSize="xl">
          {index}. {title}
        </Heading>
        <IconButton
          size="xs"
          icon={
            <Icon
              as={FaChevronDown}
              transform={isOpen ? "rotate(180deg)" : ""}
              transition="transform 0.2s ease-in-out"
            />
          }
          aria-label={"Expand Info"}
          onClick={onToggle}
        />
      </HStack>
      {description && (
        <Text as="i" color="gray.200">
          {description}
        </Text>
      )}
      <Collapse in={isOpen} animateOpacity>
        <Stack spacing={2}>
          {steps.map((d, i) =>
            typeof d === "string" ? (
              <Text key={i}>{d}</Text>
            ) : (
              <Box key={i}>{d}</Box>
            )
          )}
        </Stack>
      </Collapse>
    </Card>
  );
};

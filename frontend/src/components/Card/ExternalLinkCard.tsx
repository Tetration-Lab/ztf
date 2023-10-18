import {
  Card,
  HStack,
  Icon,
  IconButton,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useMemo } from "react";
import {
  FaChevronUp,
  FaEthereum,
  FaFile,
  FaGithub,
  FaTwitter,
} from "react-icons/fa";
import { FaFont } from "react-icons/fa6";

const selectIconByUrl = (url?: string) => {
  if (!url) return FaFont;
  if (url.includes("github")) return FaGithub;
  if (url.includes("twitter")) return FaTwitter;
  if (url.includes("etherscan") || url.includes("ethereum")) return FaEthereum;
  return FaFile;
};
export const ExternalLinkCard = ({
  title,
  description,
  url,
}: {
  title: string;
  description?: string;
  url?: string;
}) => {
  const icon = useMemo(() => selectIconByUrl(url), [url]);
  return (
    <Card p={4} h="fit-content" maxW="xs" minW={{ base: "full", md: "auto" }}>
      <HStack spacing={4}>
        <Icon as={icon} boxSize={6} />
        <Stack spacing={0}>
          <Text as="b" fontSize="lg" align="end" noOfLines={1}>
            {title}
          </Text>
          {description && (
            <Text align="end" noOfLines={6} color="gray.200">
              {description}
            </Text>
          )}
        </Stack>
        {url && (
          <IconButton
            icon={<Icon as={FaChevronUp} transform="rotate(45deg)" />}
            as={Link}
            aria-label="Go"
            href={url}
            isExternal
          />
        )}
      </HStack>
    </Card>
  );
};

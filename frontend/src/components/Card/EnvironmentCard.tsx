import { highlight } from "@/utils/json";
import { Card, Icon, IconButton, Text } from "@chakra-ui/react";
import { useMemo } from "react";
import { FaCopy } from "react-icons/fa";

enum DisplayType {
  JSON = "Json",
  BLOCK = "Block",
}

export const EnvironmentCard = ({ environment }: { environment?: object }) => {
  const highlighted = useMemo(() => highlight(environment), [environment]);

  return (
    <Card p={6} my={2}>
      <IconButton
        icon={<Icon as={FaCopy} />}
        aria-label="Copy"
        position="absolute"
        top={4}
        right={4}
        onClick={() =>
          navigator.clipboard.writeText(JSON.stringify(environment))
        }
      />
      <Text
        wordBreak="break-all"
        display="inline-block"
        overflowWrap="break-word"
        whiteSpace="pre-wrap"
        textAlign="justify"
        dangerouslySetInnerHTML={{
          __html: highlighted,
        }}
        sx={{
          color: "#ABB2BF",
          ".string": {
            color: "#98c379",
          },
          ".number": {
            color: "#E5C07B",
          },
          ".boolean": {
            color: "#E5C07B",
          },
          ".null": {
            color: "#61AFEF",
          },
          ".key": {
            color: "#C678DD",
          },
        }}
      ></Text>
    </Card>
  );
};

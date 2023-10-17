import { ONEDARK_COLOR_PROPS } from "@/constants/colors";
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
    <Card
      p={6}
      my={2}
      sx={{
        _hover: {
          ".copy-button": {
            opacity: 1,
          },
        },
      }}
    >
      <IconButton
        className="copy-button"
        icon={<Icon as={FaCopy} />}
        aria-label="Copy"
        position="absolute"
        opacity={{ base: 1, md: 0 }}
        transition="opacity 0.2s"
        top={4}
        right={4}
        onClick={() =>
          navigator.clipboard.writeText(JSON.stringify(environment))
        }
      />
      <Text
        fontFamily="Fira Code"
        wordBreak="break-all"
        display="inline-block"
        overflowWrap="break-word"
        whiteSpace="pre-wrap"
        textAlign="justify"
        dangerouslySetInnerHTML={{
          __html: highlighted,
        }}
        sx={{
          ...ONEDARK_COLOR_PROPS,
        }}
      ></Text>
    </Card>
  );
};

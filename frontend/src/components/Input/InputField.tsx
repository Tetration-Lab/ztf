import {
  HStack,
  Image,
  Input,
  InputProps,
  Stack,
  Text,
} from "@chakra-ui/react";
import _ from "lodash";
import { FieldError } from "react-hook-form";

export const InputField = ({
  title,
  description,
  inputProps,
  error,
  customInput,
  sponsor,
  inputSuffix,
}: {
  title: string;
  description: string;
  inputProps?: InputProps;
  error?: FieldError;
  customInput?: React.ReactNode;
  sponsor?: {
    name: string;
    logo: string;
  };
  inputSuffix?: React.ReactNode;
}) => {
  return (
    <Stack spacing={1}>
      <Stack
        direction={{ base: "column", md: "row" }}
        align={{ base: "start", md: "center" }}
        spacing={{ base: 2, md: 4 }}
      >
        <Stack spacing={0} w={{ base: "full", md: "lg" }}>
          <Text fontWeight="bold" fontSize="lg">
            {title}
          </Text>
          <Text color="gray.200" lineHeight={1.1}>
            {description}
          </Text>
        </Stack>

        <Stack w="full">
          <HStack>
            {customInput ?? <Input {...inputProps} isInvalid={!!error} />}
            {inputSuffix}
          </HStack>
          {error && (
            <Text
              as="b"
              color="error"
              position="absolute"
              transform="auto"
              translateY="170%"
              zIndex={1}
            >
              {error.type === "validate"
                ? error?.message ?? "Error"
                : _.startCase(error.type)}
            </Text>
          )}
        </Stack>
      </Stack>
      {sponsor && (
        <HStack>
          <Text as="i">Powered by {sponsor.name}</Text>
          <Image src={sponsor.logo} alt={sponsor.name} boxSize="16px" />
        </HStack>
      )}
    </Stack>
  );
};

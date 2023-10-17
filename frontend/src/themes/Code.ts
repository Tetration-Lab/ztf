import { defineStyle, defineStyleConfig } from "@chakra-ui/react";

export const codeTheme = defineStyleConfig({
  baseStyle: defineStyle({
    fontFamily: "Fira Code",
    borderRadius: "md",
    p: 2,
  }),
});

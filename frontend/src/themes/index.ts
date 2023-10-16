import { extendTheme } from "@chakra-ui/react";

const breakpoints = {
  sm: "23.5em",
  md: "60em",
  lg: "90em",
  xl: "120em",
};

const theme = extendTheme({
  config: {
    useSystemColorMode: false,
    initialColorMode: "dark",
  },
  fontSizes: {
    xs: "0.625rem",
    sm: "0.812rem",
    md: "1rem",
    lg: "1.25rem",
    xl: "1.562rem",
    "2xl": "1.938rem",
    "3xl": "2.438rem",
    "4xl": "3.062rem",
  },
  colors: {
    // Default is 400, Hover is 500
    accent_purple: {
      50: "#FAEEFF",
      100: "#F1C9FF",
      200: "#E7A4FF",
      300: "#DC7EFE",
      400: "#C654EF",
      500: "#A73DCD",
      600: "#892AAB",
      700: "#6C1B89",
      800: "#F1C9FF",
      900: "#340645",
    },
    accent_blue: {
      50: "#EEF2FF",
      100: "#C7D5FF",
      200: "#A0B8FF",
      300: "#799AFF",
      400: "#4F78F4",
      500: "#3A60D2",
      600: "#294AB0",
      700: "#1A378E",
      800: "#0F266C",
      900: "#07184A",
    },
    primary: {
      50: "#EEF2FF",
      100: "#FFCABE",
      200: "#FFA592",
      300: "#FF8165",
      400: "#F35836",
      500: "#D14323",
      600: "#AF3014",
      700: "#8D2109",
      800: "#6B1401",
      900: "#490D00",
    },
    grayScale: {
      50: "#EDF2F7",
      100: "#D6DCE3",
      200: "#BFC7CE",
      300: "#A9B2BA",
      400: "#949DA5",
      500: "#808891",
      600: "#6C747D",
      700: "#586068",
      800: "#3B3B3B",
      900: "#343A3F",
    },
    background: {
      primary: "#0B0C0D",
      secondary: "#343A3F",
    },
    header: {
      400: "#F8F9FA",
      500: "#E0E0E0",
    },
    body: {
      primary: "#F8F9FA",
      secondary: "#BDBDBD",
      LightPrimary: "#616161",
      LightSecondary: "#9E9E9E",
    },
    error: "#ed455c",
    success: "#46ada7",
    warning: "#f6925a",
  },
  components: {},
  fonts: {
    heading: "Inconsolata",
    body: "Inconsolata",
  },

  breakpoints,

  styles: {
    global: (_props: any) => ({
      body: {
        bg: "background.primary",
        overflowX: "hidden",
        lineHeight: "base",
        backgroundPosition: "0 -10vh",
        backgroundRepeat: "no-repeat",
        justifyContent: "center",
        backgroundSize: "cover",
      },
    }),
  },
});

export default theme;

import type { AppProps } from "next/app";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import "@fontsource/inter/400.css";
import "@fontsource/inter/700.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider
      theme={extendTheme({
        fonts: {
          body: "Inter",
          heading: "Inter",
        },
      })}
    >
      <Component {...pageProps} />
    </ChakraProvider>
  );
}

export default MyApp;

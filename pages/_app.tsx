import type { AppProps } from "next/app";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import "@fontsource/inter/400.css";
import "@fontsource/inter/700.css";
import Head from "next/head";

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
      <Head>
        <script
          defer
          data-domain="pcr-sg.vercel.app"
          src="https://plausible.io/js/plausible.js"
        ></script>
      </Head>
      <Component {...pageProps} />
    </ChakraProvider>
  );
}

export default MyApp;

import type { NextPage } from "next";
import Head from "next/head";
import clinics from "../data/dist/singapore/clinics.json";
import type { Clinic } from "../data/src/convert";
import { useEffect, useRef, useState } from "react";
import ReactMapGL, {
  NavigationControl,
  WebMercatorViewport,
  Marker,
} from "react-map-gl";
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalHeader,
  ModalCloseButton,
  List,
  ListItem,
  OrderedList,
  Link,
  ModalFooter,
} from "@chakra-ui/react";
import MapboxClient from "mapbox";
import { Location, Phone } from "@styled-icons/fluentui-system-regular";

interface PageProps {
  clinics: Clinic[];
  mapbox_token: string;
}

let mapbox: any = null;

const Home: NextPage<PageProps> = ({ clinics, mapbox_token }) => {
  const initCenter = clinics.reduce<{ long: number; lat: number }>(
    (p, c, i: number) => {
      if (i === 0) {
        return c.coordinates;
      }
      return {
        long: (p.long + c.coordinates.long) / 2,
        lat: (p.lat + c.coordinates.lat) / 2,
      };
    },
    { long: 0, lat: 0 }
  );
  const [viewport, setViewport] = useState<{
    latitude: number;
    longitude: number;
    zoom: number;
    width: number;
    height: number;
  }>({
    latitude: initCenter.lat,
    longitude: initCenter.long,
    zoom: 13,
    width: 10,
    height: 10,
  });

  const [clinicMarkers, setClinicMarkers] = useState<Clinic[]>([]);
  const [focusedMarker, setFocusedMarker] = useState<Clinic | null>(null);
  const [location, setLocation] = useState<{
    long: number;
    lat: number;
  } | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const containerRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<number>(0);
  const updateClinicsTimeoutRef = useRef<number>(0);

  function showLocation(input: string) {
    if (!mapbox) {
      mapbox = new (MapboxClient as { new (token: string): any })(mapbox_token);
    }

    mapbox.geocodeForward(`${input} Singapore`, function (err: any, data: any) {
      if (data.features && data.features.length >= 1) {
        const feature = data.features[0];
        const [long, lat] = feature.center;
        setLocation({ long, lat });
        setViewport((v) => ({
          ...v,
          longitude: long,
          latitude: lat,
          zoom: 15,
        }));
      }
    });
  }

  useEffect(() => {
    onOpen();
    if (containerRef.current) {
      setViewport({
        ...viewport,
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });

      window.addEventListener("resize", () => {
        if (resizeTimeoutRef.current) {
          window.clearTimeout(resizeTimeoutRef.current);
        }
        resizeTimeoutRef.current = window.setTimeout(() => {
          if (containerRef.current) {
            setViewport({
              ...viewport,
              width: containerRef.current.offsetWidth,
              height: containerRef.current.offsetHeight,
            });
          }
        }, 500);
      });
    }
  }, []);

  useEffect(() => {
    if (updateClinicsTimeoutRef.current) {
      window.clearTimeout(updateClinicsTimeoutRef.current);
    }
    updateClinicsTimeoutRef.current = window.setTimeout(() => {
      const bounds = new WebMercatorViewport(viewport).getBounds();
      setClinicMarkers(
        clinics
          .filter((clinic) => {
            const { long, lat } = clinic.coordinates;
            return (
              long > bounds[0][0] &&
              long < bounds[1][0] &&
              lat > bounds[0][1] &&
              lat < bounds[1][1]
            );
          })
          .filter((_, i) => i < 50)
      );

      window.setTimeout(() => {
        const focused = document.querySelector(".list .focused");
        focused?.scrollIntoView({ behavior: "smooth" });
      }, 500);
    }, 500);
  }, [viewport]);

  useEffect(() => {
    const focused = document.querySelector(".list .focused");
    focused?.scrollIntoView({ behavior: "smooth" });
  }, [focusedMarker]);

  return (
    <>
      <Head>
        <title>Pre-departure PCR Test Locator</title>
      </Head>
      <Modal onClose={onClose} isOpen={isOpen}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Text>Pre-departure PCR Clinic Locator</Text>
            <ModalCloseButton />
          </ModalHeader>
          <ModalBody>
            <Text>
              This is a tool to locate pre-departure PCR clinics faster on an
              interactive map, instead of the PDF provided by the Ministry of
              Health.
            </Text>
            <OrderedList>
              <ListItem>
                Please note that locations indicated on map are automatically
                generated and may contain errors.
              </ListItem>
              <ListItem>
                Refer to{" "}
                <Link
                  color="teal"
                  href="https://www.moh.gov.sg/licensing-and-regulation/regulations-guidelines-and-circulars/details/list-of-covid-19-swab-providers"
                >
                  the MOH website
                </Link>{" "}
                for the most up-to-date and accurate information.
              </ListItem>
            </OrderedList>
            <ModalFooter>Data last updated: 15 December 2021</ModalFooter>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Flex
        flexDirection={["column", "row"]}
        alignItems="stretch"
        height="100%"
      >
        <Box
          w={["100%", "60%"]}
          h={["50vh", "100vh"]}
          position={["relative", "sticky"]}
          top={0}
        >
          <div
            id="map_container"
            ref={containerRef}
            style={{
              width: "100%",
              height: "100%",
              zIndex: "1",
            }}
          >
            <ReactMapGL
              {...viewport}
              mapboxApiAccessToken={mapbox_token}
              onViewportChange={(nextViewport: any) => {
                setViewport(nextViewport);
              }}
            >
              <NavigationControl style={{ bottom: 50, left: 10, zIndex: 5 }} />
              {clinicMarkers.map((marker, i) => (
                <Marker
                  key={`${marker.name}_${marker.address}_${i}`}
                  latitude={marker.coordinates.lat}
                  longitude={marker.coordinates.long}
                  offsetLeft={-7}
                  offsetTop={-15}
                  onClick={() => {
                    setFocusedMarker({ ...marker });
                  }}
                >
                  <Box
                    as="b"
                    width="15px"
                    height="15px"
                    display="block"
                    border="1px"
                    borderColor="gray.900"
                    borderRadius="lg"
                    cursor="pointer"
                    zIndex={
                      marker.coordinates.lat ===
                        focusedMarker?.coordinates.lat &&
                      marker.coordinates.long ===
                        focusedMarker?.coordinates.long
                        ? 3
                        : 1
                    }
                    background={
                      marker.coordinates.lat ===
                        focusedMarker?.coordinates.lat &&
                      marker.coordinates.long ===
                        focusedMarker?.coordinates.long
                        ? "teal.200"
                        : "gray.900"
                    }
                  />
                </Marker>
              ))}
              {location && (
                <Marker
                  key="current_location"
                  latitude={location.lat}
                  longitude={location.long}
                  offsetLeft={-17}
                  offsetTop={-35}
                >
                  <Location width="35" height="35" style={{ zIndex: 4 }} />
                </Marker>
              )}
            </ReactMapGL>
          </div>
          <Box position="absolute" top="10px" left="10px" zIndex={20}>
            <Stack direction="row" spacing="1">
              <Input
                placeholder="Enter your location"
                background="white"
                id="input"
              />
              <Button
                onClick={() => {
                  showLocation(
                    (document.getElementById("input") as HTMLInputElement)
                      ?.value
                  );
                }}
              >
                Show
              </Button>
            </Stack>
          </Box>
        </Box>
        <Box
          w={["100%", "40%"]}
          h={["50vh", "auto"]}
          overflowY={["scroll", "auto"]}
          className="list"
          boxShadow="xl"
          zIndex={2}
        >
          {clinicMarkers.map((clinic, i) => {
            return (
              <Box
                color="gray.900"
                className={
                  clinic.coordinates.lat === focusedMarker?.coordinates.lat &&
                  clinic.coordinates.long === focusedMarker?.coordinates.long
                    ? "focused"
                    : ""
                }
                onClick={() => {
                  setFocusedMarker({ ...clinic });
                  setViewport((v) => ({
                    ...v,
                    longitude: clinic.coordinates.long,
                    latitude: clinic.coordinates.lat,
                  }));
                }}
                key={`${clinic.name}_${clinic.address}_${i}`}
                _hover={{
                  background:
                    clinic.coordinates.lat === focusedMarker?.coordinates.lat &&
                    clinic.coordinates.long === focusedMarker?.coordinates.long
                      ? "teal.150"
                      : "gray.50",
                }}
                p="4"
                background={
                  clinic.coordinates.lat === focusedMarker?.coordinates.lat &&
                  clinic.coordinates.long === focusedMarker?.coordinates.long
                    ? "teal.100"
                    : "transparent"
                }
                borderBottomColor="gray.100"
                borderBottomWidth={1}
              >
                <Stack direction="column">
                  <Heading size="sm">{clinic.name}</Heading>

                  <Stack direction="row" justifyContent="start">
                    <Location
                      width={20}
                      height={20}
                      style={{ flexShrink: 0 }}
                    />
                    <Text fontSize="sm">{clinic.address}</Text>
                  </Stack>
                  <Stack direction="row" justifyContent="start">
                    <Phone width={20} height={20} style={{ flexShrink: 0 }} />
                    <Text fontSize="sm">
                      <a href={`tel:${clinic.contact}`}>{clinic.contact}</a>
                    </Text>
                  </Stack>
                  <Text fontSize="sm">
                    <span
                      dangerouslySetInnerHTML={{
                        __html: clinic.notes.split("\n").join("<br />"),
                      }}
                    />
                  </Text>
                </Stack>
              </Box>
            );
          })}
        </Box>
      </Flex>
    </>
  );
};

export async function getStaticProps() {
  return {
    props: { clinics, mapbox_token: process.env.MAPBOX_TOKEN },
  };
}

export default Home;

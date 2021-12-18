const MapboxClient = require("mapbox");
// import MapboxClient from "mapbox";
import { config } from "dotenv";
import fs from "fs";
import path from "path";
import { clinics as sgClinics } from "../source/singapore/clinics-20121215";

config();

const target = process.argv[2];
const mapbox = new MapboxClient(process.env.MAPBOX_TOKEN);

interface SGClinicSource {
  "HCI Name": string;
  "HCI Address": string;
  "Contact Number": number | string;
  "Opening Hours": string;
}

interface Clinic {
  name: string;
  address: string;
  contact: string;
  notes: string;
  coordinates: {
    long: number;
    lat: number;
  };
}

export type { Clinic };

if (target.toLowerCase() === "sg") {
  const target = path.join(__dirname, "../dist/singapore/clinics.json");

  Promise.all(
    sgClinics.map(
      (clinic: SGClinicSource, i: number, arr: SGClinicSource[]) => {
        return new Promise<Clinic>((resolve, reject) => {
          setTimeout(() => {
            console.log(`geocoding ${i + 1}/${arr.length}`);
            mapbox.geocodeForward(
              `${clinic["HCI Address"]} Singapore`,
              function (err: any, data: any) {
                if (err) {
                  reject(err);
                }

                if (!data.features || data.features.length < 1) {
                  reject(`no result found for ${clinic["HCI Address"]}`);
                }

                const feature = data.features[0];
                const address = feature.place_name;
                const [long, lat] = feature.center;

                resolve({
                  name: clinic["HCI Name"],
                  address,
                  contact: clinic["Contact Number"].toString(),
                  notes: clinic["Opening Hours"],
                  coordinates: { long, lat },
                });
              }
            );
          }, i * 100);
        });
      }
    )
  )
    .then((clinicObjects: Clinic[]) => {
      fs.writeFile(target, JSON.stringify(clinicObjects), (err) => {
        if (err) {
          throw new Error("failed to write file");
        }
        console.log("ok");
      });
    })
    .catch((err) => {
      console.log(err);
    });
}

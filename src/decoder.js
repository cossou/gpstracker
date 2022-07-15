import {
  convertDateTime,
  decToBinary,
  hexToDecimal,
  translateCoordinates,
} from "./utils.js";
import {
  SOS,
  POSITION_MANUAL,
  STATUS,
  POSITION_OFFLINE,
  POSITION,
  HEARTBEAT,
  LOGIN,
} from "./constants.js";

let devices = {};

export function decoder(buffer, conn) {
  const hexString = buffer.toString("hex");
  const type = hexString.substring(6, 8);
  const port = conn.remotePort;
  const imei = getDeviceIMEIByPort(port);

  console.log("DEVICES: ", JSON.stringify(devices, null, 2));

  switch (type) {
    // LOGIN
    case LOGIN:
      console.log("LOGIN 01");
      const imeiLogin = hexString.substring(9, 24);

      // Login OK response
      const response = Buffer.from("787801010D0A", "hex");
      conn.write(response);

      devices = { ...devices, [port]: { imei: imeiLogin } };

      return { imei: imeiLogin, hexString, type };

    // HEARTBEAT
    case HEARTBEAT:
      console.log("HEARTBEAT 08");
      console.log("STRING: ", hexString);
      console.log("IMEI: ", imei);

      return {
        imei,
        hexString,
        type,
        heartbeat: true,
      };

    // POSITION
    case POSITION:
    case POSITION_OFFLINE:
      console.log("POSITION ", type);
      console.log("STRING: ", hexString);
      console.log("IMEI: ", imei);

      if (type === POSITION_OFFLINE) {
        console.log("GPS offline positioning packet");
      }

      const datetime = convertDateTime(hexString.substring(8, 20));
      const satellites = hexToDecimal(hexString.substring(21, 22));
      const hexLat = hexString.substring(22, 30);
      const hexLon = hexString.substring(30, 38);
      const speed = hexToDecimal(hexString.substring(38, 40));
      const flags = decToBinary(hexToDecimal(hexString.substring(40, 42)));
      const heading = hexToDecimal(hexString.substring(42, 44));

      const { lat, lon } = translateCoordinates(hexLat, hexLon, flags);

      console.log(`DATE: ${datetime}`);
      console.log(`SATELLITES: ${satellites}`);
      console.log(`LAT: ${lat}`);
      console.log(`LON: ${lon}`);
      console.log(`SPEED: ${speed}`);
      console.log(`FLAGS: ${flags}`);
      console.log(`HEADING: ${heading}º`);

      conn.write(buffer);

      if (type === POSITION) {
        const { locations = [], ...remain } = devices[port];

        devices[port] = {
          ...remain,
          locations: [
            ...locations,
            { datetime, lat, lon, speed, heading, satellites, flags },
          ],
        };
      }

      return {
        imei,
        hexString,
        type,
        datetime,
        satellites,
        lat,
        lon,
        speed,
        heading,
        flags,
      };

    // STATUS
    case STATUS:
      console.log("STATUS 13");
      console.log("STRING: ", hexString);
      console.log("IMEI: ", imei);

      const battery = hexToDecimal(hexString.substring(8, 10));
      const softwareVersion = hexToDecimal(hexString.substring(10, 12));
      const area = hexToDecimal(hexString.substring(12, 14));
      const uploadInterval = hexToDecimal(hexString.substring(14, 16));

      console.log(`BATTERY ${battery}%`);
      console.log(`SOFTWARE v${softwareVersion}`);
      console.log(`AREA ${area}`);
      console.log(`UPLOAD INT ${uploadInterval}`);

      conn.write(buffer);

      const props = devices[port];

      devices[port] = {
        ...props,
        battery,
        softwareVersion,
        area,
        uploadInterval,
      };

      return {
        imei,
        hexString,
        type,
        battery,
        softwareVersion,
        uploadInterval,
        area,
      };

    // POSITION_MANUAL
    case POSITION_MANUAL:
      console.log("MANUAL POSITION 80");
      console.log("STRING: ", hexString);
      console.log("IMEI: ", imei);

      const code = hexString.substring(8, 10);
      let message = "";

      switch (code) {
        case "01":
          message = `CODE ${code} - Incorrect time`;
          break;
        case "02":
          message = `CODE ${code} - LBS less`;
          break;
        case "03":
          message = `CODE ${code} - WIFI less`;
          break;
        case "04":
          message = `CODE ${code} - LBS search more than 3 times`;
          break;
        case "05":
          message = `CODE ${code} - Same LBS and WIFI data`;
          break;
        case "06":
          message = `CODE ${code} - Prohibit LBS upload, and there is no WIFI`;
          break;
        case "07":
          message = `CODE ${code} - GPS spacing is less than 50 meters`;
          break;
        default:
          message = `UNKNOWN CODE ${code}`;
      }

      console.log(message);
      conn.write(buffer);

      return {
        imei,
        hexString,
        type,
        code,
        message,
      };

    // SOS
    case SOS:
      console.log("SOS 99");
      console.log("STRING: ", hexString);
      conn.write(buffer);
      return { imei, hexString, type, sos: true };

    // OTHER NOT IMPLEMENTED
    default:
      console.log("UNKNOWN FEATURE ", type);
      console.log("STRING: ", hexString);
      console.log("IMEI: ", imei);

      conn.write(buffer);

      return { imei, hexString, type };
  }

  function getDeviceIMEIByPort(port) {
    const { imei } = devices[port] || {};
    return imei;
  }
}

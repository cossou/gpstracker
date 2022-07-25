import fs from "fs";
import { buildGPX, GarminBuilder } from "gpx-builder";
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
  DEVICE_START,
  DEVICE_STOP,
} from "./constants.js";

const { Point } = GarminBuilder.MODELS;

const devices = [];

export function decoder(data, conn) {
  const hexString = data.toString("hex");
  const type = hexString.substring(6, 8);
  const port = conn.remotePort;
  const device = getDeviceByPort(port);
  const { imei } = device;

  console.log();
  console.log("DEVICES: ", JSON.stringify(devices, null, 2));
  console.log();
  console.log({ device });
  console.log();

  switch (type) {
    // LOGIN
    case LOGIN:
      console.log("LOGIN 01");
      const imeiLogin = hexString.substring(9, 24);

      // Login OK response
      const response = Buffer.from("787801010D0A", "hex");
      conn.write(response);

      updateDevice({ imei: imeiLogin, port }, imeiLogin);

      return { imei: imeiLogin, port, hexString, type };

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

      const datetimeHex = hexString.substring(8, 20);
      const datetime = convertDateTime(datetimeHex);
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

      // POSITION OK response
      conn.write(
        Buffer.from(
          `${DEVICE_START}00${type}${datetimeHex}${DEVICE_STOP}`,
          "hex"
        )
      );

      const { locations = [], ...remain } = device;
      locations.push({
        datetime,
        lat,
        lon,
        speed,
        heading,
        satellites,
        flags,
        type,
      });

      updateDevice(
        {
          ...remain,
          locations,
        },
        imei
      );

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

      conn.write(data);

      updateDevice(
        {
          battery,
          softwareVersion,
          area,
          uploadInterval,
        },
        imei
      );

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
      conn.write(data);

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
      conn.write(data);
      return { imei, hexString, type, sos: true };

    // OTHER NOT IMPLEMENTED
    default:
      console.log("UNKNOWN FEATURE ", type);
      console.log("STRING: ", hexString);
      console.log("IMEI: ", imei);

      conn.write(data);

      return { imei, hexString, type };
  }
}

export function getDeviceByIMEI(imei) {
  const device = devices.find(({ imei: deviceImei }) => imei === deviceImei);
  return device || {};
}

export function getDeviceByPort(port) {
  const device = devices.find(({ port: devicePort }) => port === devicePort);
  return device || {};
}

export function updateDevice(obj, imei) {
  const index = devices.findIndex(
    ({ imei: deviceImei }) => imei === deviceImei
  );

  if (index < 0) {
    devices.push({ imei, ...obj });
  } else {
    const device = devices.find(({ imei: deviceImei }) => imei === deviceImei);
    devices.splice(index, 1);
    devices.push({ ...device, ...obj });
  }
}

export function deviceGPX(deviceImei) {
  const { imei, locations = [] } = getDeviceByIMEI(deviceImei);

  if (!imei || locations.length <= 1) {
    console.log("Error! No data to create GPX!", { imei, locations });
    return;
  }

  const now = new Date();
  const filename = `trip_${imei}_${now.toISOString()}.gpx`;

  locations.sort((a, b) => a.datetime - b.datetime);

  const points = locations.map(
    ({ lat, lon, datetime, heading }) =>
      new Point(lat, lon, {
        ele: 0,
        time: datetime,
        bearing: heading,
      })
  );

  const gpxData = new GarminBuilder();
  gpxData.setSegmentPoints(points);

  const data = buildGPX(gpxData.toObject());

  // fs.writeFileSync(filename, data);

  console.log();
  console.log(`Write GPX ${filename}!`);
  console.log();

  return data;
}

export function deviceStatus(deviceImei) {
  return getDeviceByIMEI(deviceImei);
}

export function deviceRestart(deviceImei) {
  const device = getDeviceByIMEI(deviceImei);
}

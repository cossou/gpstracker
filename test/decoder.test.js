import {
  HEARTBEAT,
  LOGIN,
  POSITION,
  POSITION_MANUAL,
  SOS,
  STATUS,
} from "../src/constants";
import { decoder } from "../src/decoder";

const mockConn = {
  write: () => {},
};

const imei = "359339077229061";

it("should return the correct imei on LOGIN", () => {
  const hexString = "78780d0103593390772290615b0d0a";
  const buffer = Buffer.from(hexString, "hex");
  expect(decoder(buffer, mockConn)).toEqual({
    hexString,
    imei,
    type: LOGIN,
  });
});

it("should return the correct object on HEARTBEAT", () => {
  const hexString = "787801080d0a";
  const buffer = Buffer.from(hexString, "hex");
  expect(decoder(buffer, mockConn)).toEqual({
    hexString,
    type: HEARTBEAT,
    imei,
    heartbeat: true,
  });
});

it("should return the correct object on STATUS", () => {
  const hexString = "78780713445b08195a0d0a";
  const buffer = Buffer.from(hexString, "hex");
  expect(decoder(buffer, mockConn)).toEqual({
    hexString,
    type: STATUS,
    imei,
    battery: "68",
    area: "8",
    softwareVersion: "91",
    uploadInterval: "25",
  });
});

it("should return the correct object on SOS", () => {
  const hexString = "787801990d0a";
  const buffer = Buffer.from(hexString, "hex");
  expect(decoder(buffer, mockConn)).toEqual({
    hexString,
    type: SOS,
    imei,
    sos: true,
  });
});

it("should return the correct object on POSITION_MANUAL", () => {
  const hexString = "78780280070d0a";
  const buffer = Buffer.from(hexString, "hex");
  expect(decoder(buffer, mockConn)).toEqual({
    hexString,
    type: POSITION_MANUAL,
    imei,
    code: "07",
    message: "CODE 07 - GPS spacing is less than 50 meters",
  });
});

it("should return the correct object on POSITION", () => {
  //const hexStrin  "7878151016070e0a000f960427a2fb00fb811c553ce1009c000d0a";
  const hexString = "787812100a03170f32179c026b3f3e0c22ad651f34600d0a";
  const buffer = Buffer.from(hexString, "hex");
  expect(decoder(buffer, mockConn)).toEqual({
    hexString,
    type: POSITION,
    imei,
    datetime: new Date("2010-03-23T15:50:23.000Z"),
    lat: "22º32.7657999999999",
    lon: "113º6.640166666667028",
    satellites: "12",
    speed: "31",
    heading: "96",
    flags: "110100",
  });
});

it("should return the correct object on POSITION", () => {
  const hexString = "7878151016070e0a000f960427a2fb00fb811c553ce1009c000d0a";
  const buffer = Buffer.from(hexString, "hex");
  expect(decoder(buffer, mockConn)).toEqual({
    hexString,
    type: POSITION,
    imei,
    datetime: new Date("2022-07-14T09:00:15.000Z"),
    lat: "38º43.54970000000003",
    lon: "-9º9.419599999999946",
    satellites: "6",
    speed: "85",
    heading: "225",
    flags: "111100",
  });
});

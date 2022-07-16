import {
  convertDateTime,
  hexToDecimal,
  decToBinary,
  translateCoordinates,
} from "../src/utils";

it("should convert hex to decimal string", () => {
  expect(hexToDecimal("0427")).toEqual("1063");
  expect(hexToDecimal("1a3b4ce2278a")).toEqual("28841995282314");
  expect(hexToDecimal("AaAa")).toEqual("43690");
});

it("should convert str to binary string", () => {
  expect(decToBinary(60)).toEqual("111100");
});

it("should convert hex to date time", () => {
  expect(convertDateTime("16070d0a2e23")).toEqual(
    new Date("2022-07-13T09:46:35.000Z")
  );

  expect(convertDateTime("16070D0A2E23")).toEqual(
    new Date("2022-07-13T09:46:35.000Z")
  );
});

it("should translate hex coordinates to text", () => {
  expect(translateCoordinates("026B3F3E", "0C22AD65", "110100")).toEqual({
    lat: 22.54609667,
    lon: 113.11066944,
  });

  expect(translateCoordinates("0427a2fb", "00fb811c", "111100")).toEqual({
    lat: 38.72582833,
    lon: -9.15699333,
  });
});

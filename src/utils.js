import convert from "geo-coordinates-parser";

export function hexToDecimal(str) {
  return `${parseInt(str, 16)}`;
}

export function decToBinary(str) {
  return Number(str).toString(2);
}

export function decToHex(number) {
  return Number(number).toString(16).padStart(2, "0").toUpperCase();
}

export function convertDateTime(hex) {
  const year = hexToDecimal(hex.substring(0, 2));
  const month = hexToDecimal(hex.substring(2, 4));
  const day = hexToDecimal(hex.substring(4, 6));

  const hours = hexToDecimal(hex.substring(6, 8));
  const minutes = hexToDecimal(hex.substring(8, 10));
  const seconds = hexToDecimal(hex.substring(10, 12));

  const date = new Date(
    2000 + parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes),
    parseInt(seconds)
  );

  return date;
}

export function convertIntoDateTime(datetime) {
  const year = decToHex(datetime.getFullYear().toString().substr(-2));
  const month = decToHex(datetime.getUTCMonth() + 1);
  const day = decToHex(datetime.getUTCDate());

  const hours = decToHex(datetime.getHours());
  const minutes = decToHex(datetime.getMinutes());
  const seconds = decToHex(datetime.getSeconds());

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

export function translateCoordinates(hexLat, hexLon, flags) {
  const decLat = hexToDecimal(hexLat) / 30000;
  const decLatDegrees = Math.trunc(decLat / 60);
  const decLatMinutes = decLat - decLatDegrees * 60;

  const decLon = hexToDecimal(hexLon) / 30000;
  const decLonDegrees = Math.trunc(decLon / 60);
  const decLonMinutes = decLon - decLonDegrees * 60;

  const lat =
    flags[1] == 0
      ? `-${decLatDegrees}º ${decLatMinutes}`
      : `${decLatDegrees}º ${decLatMinutes}`;

  const lon =
    flags[2] == 1
      ? `-${decLonDegrees}º ${decLonMinutes}`
      : `${decLonDegrees}º ${decLonMinutes}`;

  const converted = convert(`${lat}, ${lon}`, 8);

  return {
    lat: converted.decimalLatitude,
    lon: converted.decimalLongitude,
  };
}

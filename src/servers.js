import net from "net";
import express from "express";
import { deviceGPX, deviceStatus } from "./decoder.js";
import { handleConnection, TCP_PORT } from "./tcp.js";

const tcpServer = net.createServer();
tcpServer.on("connection", handleConnection);
tcpServer.listen(TCP_PORT, () => {
  console.log(`TCP Server listening on ${TCP_PORT}`);
});

const app = express();

app.get("/gpx/:imei", function (req, res) {
  const { imei } = req.params;
  console.log("IMEI: ", imei);
  const gpxFile = deviceGPX(imei);

  if (!gpxFile) {
    res.sendStatus(404);
    return;
  }

  res.set({
    "content-type": "application/gpx+xml",
    "content-disposition": `attachment; filename=${imei}.gpx`,
  });

  res.end(gpxFile);
});

app.get("/status/:imei", function (req, res) {
  const { imei } = req.params;
  console.log("IMEI: ", imei);
  const status = deviceStatus(imei);

  res.json(status);
});

app.listen(3000, () => {
  console.log("Express listening on 3000");
});

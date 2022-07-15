import net from "net";
import { decoder } from "./decoder.js";

const server = net.createServer();

server.on("connection", handleConnection);

server.listen(2222, function () {
  console.log("server listening to %j", server.address());
});

function handleConnection(conn) {
  const remoteAddress = conn.remoteAddress + ":" + conn.remotePort;
  console.log("new client connection from %s\n", remoteAddress);

  conn.on("data", onConnData);
  conn.once("close", onConnClose);
  conn.on("error", onConnError);

  function onConnData(d) {
    console.log("");
    decoder(d, conn);
  }

  function onConnClose() {
    console.log("connection from %s closed", remoteAddress);
  }

  function onConnError(err) {
    console.log("Connection %s error: %s", remoteAddress, err.message);
  }
}

import { decoder } from "./decoder.js";

export const TCP_PORT = 2222;

export function handleConnection(conn) {
  const remoteAddress = conn.remoteAddress + ":" + conn.remotePort;
  console.log("New client connection from %s\n", remoteAddress);

  conn.on("data", onConnData);
  conn.once("close", onConnClose);
  conn.on("error", onConnError);

  function onConnData(data) {
    decoder(data, conn);
  }

  function onConnClose() {
    console.log("Connection from %s closed", remoteAddress);
  }

  function onConnError(err) {
    console.log("Connection %s error: %s", remoteAddress, err.message);
  }
}

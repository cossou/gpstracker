# GPS Tracker

Implements some methods of the protocol for "Zhongxun Locator Communication Protocol".

Working with "GF-22" device from AliExpress.

# How to run this

Install dependencies:

```bash
npm install
```

Start the TCP server:

```bash
npm start
```

It will run the server on port 2222.

I use `ngrok` to expose the server to the internet.

```bash
$ ngrok tcp 2222

...
Forwarding                    tcp://XXX.tcp.eu.ngrok.io:12345 -> localhost:2222
```

Point your device to the address above by sending an SMS to your device:

```
// server#domain#port example:
server#XXX.tcp.eu.ngrok.io#12345
```

You should receive an "OK" SMS response.

# Tests

Run test suite:

```bash
npm test
```

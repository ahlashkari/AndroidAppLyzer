The Android-Sandbox web server is a Node.js application built on the Express framework. It acts as the primary user interface for clients intending on submitting analyses to Android-Sandbox.

## Prerequisites

* Your machine must be reachable from the clients using the service, at the desired port (likely `443` or `80`).
* If using TLS, you must issue certificates for the (sub)domain pointing to the server.

## Installation

```
cd Android-Sandbox/web-server
npm install
npm run start
```

## Configuration

### Change `configuration.json` parameters
Before continuing, you must [change configuration parameters](./Web-server-configuration-parameters) to match your desired configuration.

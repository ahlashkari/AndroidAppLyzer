## Description
All configurable parameters for the analysis server can be found in `Android-Sandbox/web-server/configuration.json` after the server has started for the first time.

## Setting parameters
* You must set the `server` prefixed parameters to match your desired web server configuration, if different.
* You must set the `db` prefixed parameters to match your MongoDB database configuration. More details [here](./MongoDB-configuration).
* You must set the `sessionSecret` parameter to use a long, secure string or password. This is used when creating session cookies with clients on the website.

| Parameter | Default value | Description |
|-|-|-|
| `serverPort` | `80` | Web server listening port |
| `serverUseTLS` | `false` | Use TLS to secure communication |
| `serverTLSCertName` | `cert.pem` | TLS certificate name |
| `serverTLSKeyName` | `key.pem` | TLS key name |
| `dbHost` | `example.com` | MongoDB host |
| `dbPort` | `61337` | MongoDB port (only for old driver) |
| `dbUser` | `johndoe` | MongoDB database username |
| `dbPassword` | `hunter2` | MongoDB database password  |
| `dbReplicaSet` | `replicasetname` | MongoDB replica set (only for new driver) |
| `dbName` | `exampledatabase` | MongoDB database name |
| `dbNewDriver` | `false` | New driver uses `mongodb+srv://`, old uses `mongodb://` |
| `pathTemporary` | `/tmp` | Path for temporary analysis file storage |
| `sessionSecret` | `longsecuresecret` | Secret used to encrypt browser cookies |
| `registrationDisabledNote` | `Sorry, registration is currently disabled! <a href=\"https://example.com/\">Why?</a>` | Error message displayed when registration is disabled |
| `tableLengthPerPage` | `20` | Number of entries shown per-page in tables on the website |

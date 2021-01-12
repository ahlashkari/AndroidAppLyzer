# Setting up virtualenv

## Prerequisite

- Python 3.6+ with venv package
- Linux

## Create virtualenv

```sh
$ cd <your-path-of-deployment-dir>
$ python3 -mvenv venv
$ . venv/bin/activate
(venv) $ pip install wheel
```

## Activate virtualenv

Assuming that you are currently in the deployment directory.

```sh
$ . venv/bin/activate
```

You should now see the shell prompt gets prefixed by `(venv)`. Do this **every time** before you wish to start the analysis server.

## Install nodeenv for analysis/web server

Assuming that you already activated the virtualenv.

```sh
(venv) $ pip install nodeenv
# As of December 6, 2019 node-frida still does not work with node 13+
(venv) $ nodeenv --node=12.13.1 -p
```

## Install dependencies for analysis and web server

Refer to [Analysis server set up](./Analysis-server-set-up) and [Web server set up](./Web-server-set-up). **Make sure the virtualenv is active** during the installation.

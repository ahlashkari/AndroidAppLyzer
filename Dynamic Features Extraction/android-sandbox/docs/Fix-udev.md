## Description
Often, `fastboot` and `adb` will not work properly when connecting Android devices unless the processes run as root. You can see this as `no-permissions` when running `adb devices`. Use the below command and follow the prompts to fix this. This command requires root.

## Prerequsites

* You have already followed [the prerequisites, installation, and configuration](./Analysis-server-set-up) for the analysis server up to this point.

## Procedure

In the `analysis-server` directory, run:

```
sudo npm run fix-udev
```
This command can be run for a single device, or for multiple devices.

If multiple devices are from the same vendor, only one vendor will appear for that group of devices.

If a device's vendor is already in the udev list, and that is the only device attached during the procedure, the command will fail. Otherwise, the vendor will be ignored and other vendors will be processed normally.
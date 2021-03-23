## Description

In order to restore the device after executing potential malware, device backups must be used. You must create these backups before using the Android-Sandbox analysis server. If devices are identical, a single backup can be used for all devices of the same type.

## Prerequsites

* You have already followed [the prerequisites, installation, and configuration](./Analysis-server-set-up) for the analysis server up to this point.
* The device has an unlocked bootloader.
* If the device has been previously used, you have factory reset the device to remove all personal information.
* You have installed applications and configured the device to the state you wish it to be in after every restoration.
* You have [enabled ADB debugging](https://developer.android.com/studio/command-line/adb#Enabling) on the device.
* You have connected the device to the machine, and ensured the device is the only Android device connected.

## Finding your product

Open a terminal and run
```
adb devices -l
```
to determine the product value for your device. For example, if the output contained `product:sailfish`, your product value is `sailfish`. From now on, when you see `productvalue` in a command, replace it with your product value.

## Preparing TWRP

[Download TWRP](https://twrp.me/Devices/) for the specific device. You only need the latest `.img` file, not the installer.

Copy the `.img` file to `analysis-server/devicefiles` and rename it to `productvalue-twrp.img`.

## Booting into TWRP

Open a terminal in `analysis-server/devicefiles` and type

```
adb reboot bootloader
```

and wait until the device displays something containing the text `fastboot mode`. This should be fairly quick. If the device boots back into the operating system, the device is likely not compatible with Android-Sandbox.

Next, type

```
fastboot boot productvalue-twrp.img
```
and the device will boot into TWRP.

## Making the backup

You may see a prompt `Keep System Read only?`, and in that case, swipe the `Swipe to Allow Modifications` bar at the bottom.

Tap `Backup`.

This part depends heavily on the type of device being used. This procedure might not work for all devices, and it might take some experimentation to make a successful image. It's suggested that you follow a TWRP backup procedure specific for your device, if one can be found on the web.

If the list `Select Partitions to Backup` contains the item `System Image`, select items in list A, otherwise select the items in list B. Some items may not exist on your device, and if so, ignore them.

| List A | List B |
|-|-|
| `Boot` | `Boot` |
| `System Image` | `System` |
| `Data` | `Data` |
| `EFS` | `EFS` |
| `Vendor Image` | |

<!--TODO: to compress or not to compress-->

Swipe the `Swipe to Backup` bar. The backup will now take place. Wait until this finishes.

## Preparing checksums

While still in `analysis-server/devicefiles`, type

```
adb shell
```

and a remote shell will open, allowing you to send commands to the device. In this remote shell, type

```
cd /sdcard/TWRP/BACKUPS
ls
```

and you should see one folder listed, which should be labeled with the devices serial number. Enter that directory with

```
cd someserialnumber
ls
```

and you should see another folder, this time labeled with the date and some other data. Move and rename this directory to the root of `/sdcard` with

```
mv datelabeleddirectory /sdcard/productvalue-backup
cd /sdcard/productvalue-backup
ls
```

These are your backup files. Type

```
md5sum *
```

to generate checksums for these files, and the device should produce them. For example, the output should look something like this:

```
29fef19268b9d3f5407633d44283b731  boot.emmc.win
1a080ec39df4bd4b8df6622b9b502583  boot.emmc.win.sha2
daa2e73f2262c68b5d2df1b83e9798cc  data.ext4.win
622daa2546cd209e0c92d077c5f57736  data.ext4.win.sha2
18ffcfaac5ed0c1e26726bdc7ce7e025  data.info
4961bb0bb4b402bedda720466eb9a66a  efs1.emmc.win
8c28e00df764f64e15041dea707ba94a  efs1.emmc.win.sha2
238d4df48aa941a399e4158d6e9cfa3e  efs2.emmc.win
20a9abe22d13a13ef1de01189fce437c  recovery.log
f778ca60e5cb2d753919f7e14df401a9  system_image.emmc.win
2ad96af93661fd508b79e5aff9475a06  system_image.emmc.win.sha2
d6735e03a258977205eb5c82546fdbf1  vendor_image.emmc.win
8f807b215906599d5b27a48c9f5f7751  vendor_image.emmc.win.sha2
```

Copy these lines of text, not including the terminal prompt line, into a new file at `analysis-server/devicefiles/productvalue-backup-hashes`.

Type

```
cd ../
tar -czvf productvalue-backup.tar.gz productvalue-backup
```

This will create an archive for the backup, which might take some time. Next type

```
md5sum productvalue-backup.tar.gz
```

to generate the checksum for the archive. It should look something like this:

```
751da3d109c737ff1354407cc3c3f310  productvalue-backup.tar.gz
```

Copy this line of text, not including the terminal prompt line, into a new file at `analysis-server/devicefiles/productvalue-backup-hash`.

## Downloading the backup

Type

```
exit
```

to leave the remote prompt, and ensure you're still in `analysis-server/devicefiles`. Next, type

```
adb pull /sdcard/productvalue-backup.tar.gz
```

to download the archive, and wait until finished. Type

```
cd
```

and you should see four files for each device product:

```
productvalue-backup-hash
productvalue-backup-hashes
productvalue-backup.tar.gz
productvalue-twrp.img
```

If you're missing any of these files, you missed a step!

## Return to OS

Type

```
adb reboot
```

to return the phone to the OS.

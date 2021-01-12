The analysis server uses an interval to query the web-server. This query searches for analyses that have been marked as queued (state `2`). Once results have been returned, the analysis server ensures that new analyses are not already in the local in-memory cache, and if they aren't, they're added to the cache. The analysis server attempts to pair queued jobs to devices regularly. Once paired with a device, the analysis takes it's own asynchronous path through the pipeline. The pipeline defines an array of steps that the device will traverse sequentially, from lowest to highest index. For example:

```
{
	step: "coolNewStep",
	exec: async (job) => {
		job.device.log("Doing that cool new step...");
		job.importantData = await dubiousFunction(job);
	}
},
```

Each step contains two keys, the step name, and the execution function. All execution functions are asynchronous, so we can await promises inside them to write more synchronous-looking code. Note that the device paired to the analysis can be accessed through `job.device` if you have a reference to the job, and the job being processed by a device can be accessed through `device.job`, if you have a reference to the device.

Once the analysis has traversed all steps, the system performs clean-up. Emulators are killed and released for further provisioning. Devices proceed through a recovery procedure to restore their images to a previous version.

All devices hold two recovery images in their `/sdcard` directory. One compressed `tar.gz` archive, and one loose-file directory. The automated recovery procedure for devices is as follows:

1. Reboot the device into bootloader mode with `adb reboot bootloader`.
2. Boot a TWRP ROM for the device using `fastboot boot /path/to/deviceproduct-twrp.img`.
3. Use `adb` to run `md5sum` on the loose files in `/sdcard/deviceproduct-backup`. If verification passes go-to step 6, else go-to step 4.
4. Verify archive `/sdcard/deviceproduct-backup.tar.gz` with `md5sum`. If verifcation passes, extract the archive over the existing loose files and go-to step 3, else go-to step 5.
5. Repload the archive from the analysis server, and go-to step 4.
6. Remount device partitions as read-write with `shell twrp remountrw`.
7. Restore the backup with `shell twrp restore /sdcard/deviceproduct-backup`.
8. Restart the device with `adb reboot`.

In the above context, verification means that we are comparing the results of `md5sum` on the remote device, with the known values (for that device) stored on the analysis server.
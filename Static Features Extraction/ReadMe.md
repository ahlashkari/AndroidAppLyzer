#### Features Extraction is the second step :
We used apktool to reverse engineer the apks, then with the "grep" http://man7.org/linux/man-pages/man1/grep.1.html 
command of shell we extracted the static features from AndroidManifest.xml file, finally a binary vectors with these features are creted 
to each apk.

#### Prerequisites :
Download apktool https://ibotpeaches.github.io/Apktool/

#### Commands to run the scripts :
```
$ sudo; for dir in <Input Folder>/*; do Static_Capturing_Code.sh "$(basename "$dir")" <Output Folder> ;done
$ for i in <Output_Folder>/*/*.txt; do python Create_Unique_Listes.py $i; done
$ for i in <Output_Folder>/*/*.txt; do python Create_Vector.py $i <Output_Folder_1>/; done 
```

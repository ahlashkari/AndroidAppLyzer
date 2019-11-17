#!/bin/bash

echo -e " Starting Static Analysis ... "
mkdir $2/$1_Analysed/
echo -e "APK: "$1
echo -e " Unpacking using APKTool..."
apktool d $PWD/$1 -o $2/$1_Analysed/ -f 


echo -e " Displaying Package Info in AndroidManifest.xml..."
echo -e " Package : " >> $2/$1_Analysed/$1_Static_Features.txt
grep -oP 'package=.*" ' $2/$1_Analysed/AndroidManifest.xml | sort -u >> $2/$1_Analysed/$1_Static_Features.txt
echo -e "  " >> $2/$1_Analysed/$1_Static_Features.txt

echo -e " Displaying Activities in AndroidManifest.xml..."
echo -e " Activities : " >> $2/$1_Analysed/$1_Static_Features.txt
grep -oP 'activity.*" ' $2/$1_Analysed/AndroidManifest.xml  | cut -f -1  | sort -u >> $2/$1_Analysed/$1_Static_Features.txt
echo -e "  " >> $2/$1_Analysed/$1_Static_Features.txt

echo -e " Displaying Services AndroidManifest.xml..."
echo -e " Services : " >> $2/$1_Analysed/$1_Static_Features.txt
grep -oP 'service .*"' $2/$1_Analysed/AndroidManifest.xml | sort -u >> $2/$1_Analysed/$1_Static_Features.txt
echo -e "  " >> $2/$1_Analysed/$1_Static_Features.txt

echo -e " Displaying Content Providers in AndroidManifest.xml..."
echo -e " Providers : " >> $2/$1_Analysed/$1_Static_Features.txt
grep -oP 'provider .*"' $2/$1_Analysed/AndroidManifest.xml | sort -u >> $2/$1_Analysed/$1_Static_Features.txt
echo -e "  " >> $2/$1_Analysed/$1_Static_Features.txt

echo -e " Displaying Broadcast Receivers in AndroidManifest.xml..."
echo -e " Receivers : " >> $2/$1_Analysed/$1_Static_Features.txt
grep -oP 'receiver .*"' $2/$1_Analysed/AndroidManifest.xml | sort -u >> $2/$1_Analysed/$1_Static_Features.txt
echo -e "  " >> $2/$1_Analysed/$1_Static_Features.txt

echo -e " Displaying Intent Filter Actions in AndroidManifest.xml..."
echo -e " Intents Action : " >> $2/$1_Analysed/$1_Static_Features.txt
grep -oP 'action.*".*"' $2/$1_Analysed/AndroidManifest.xml | sort -u >> $2/$1_Analysed/$1_Static_Features.txt
echo -e "  " >> $2/$1_Analysed/$1_Static_Features.txt

echo -e " Displaying Intent Filter Categories in AndroidManifest.xml..."
echo -e " Intents Category : " >> $2/$1_Analysed/$1_Static_Features.txt
grep -oP 'category.*"' $2/$1_Analysed/AndroidManifest.xml | sort -u >> $2/$1_Analysed/$1_Static_Features.txt
echo -e "  " >> $2/$1_Analysed/$1_Static_Features.txt

echo -e " Displaying Permissions in AndroidManifest.xml..."
echo -e " Permissions : " >> $2/$1_Analysed/$1_Static_Features.txt
grep -oP 'permission.*"' $2/$1_Analysed/AndroidManifest.xml  | sort -u >> $2/$1_Analysed/$1_Static_Features.txt
echo -e "  " >> $2/$1_Analysed/$1_Static_Features.txt

echo -e " Displaying Exports in AndroidManifest.xml..."
echo -e " Exported : " >> $2/$1_Analysed/$1_Static_Features.txt
grep -oP 'exported="true".*"' $2/$1_Analysed/AndroidManifest.xml | sort -u >> $2/$1_Analysed/$1_Static_Features.txt
echo -e "  " >> $2/$1_Analysed/$1_Static_Features.txt

echo -e " Displaying Backups in AndroidManifest.xml..."
echo -e " Backup : " >> $2/$1_Analysed/$1_Static_Features.txt
egrep -o 'allowBackup.*" ' $2/$1_Analysed/AndroidManifest.xml | sort -u >> $2/$1_Analysed/$1_Static_Features.txt
echo -e "  " >> $2/$1_Analysed/$1_Static_Features.txt

echo -e " Displaying meta-data in AndroidManifest.xml..."
echo -e " Meta-Data : " >> $2/$1_Analysed/$1_Static_Features.txt
grep -oP 'meta-data.*"' $2/$1_Analysed/AndroidManifest.xml | sort -u >> $2/$1_Analysed/$1_Static_Features.txt
echo -e "  " >> $2/$1_Analysed/$1_Static_Features.txt

echo -e " Displaying uses-features in AndroidManifest.xml..."
echo -e " Uses-Features : " >> $2/$1_Analysed/$1_Static_Features.txt
egrep -i 'uses-features.*"' $2/$1_Analysed/AndroidManifest.xml | sort -u >> $2/$1_Analysed/$1_Static_Features.txt
echo -e "  " >> $2/$1_Analysed/$1_Static_Features.txt

echo -e " Displaying Number of icons..."
echo -e " Number of Icons : " >> $2/$1_Analysed/$1_Static_Features.txt
find $2/$1_Analysed/ -iname "*.png" -type f -printf '.' | wc -c  >> $2/$1_Analysed/$1_Static_Features.txt
echo -e "  " >> $2/$1_Analysed/$1_Static_Features.txt

echo -e " Displaying Number of Pictures..."
echo -e " Number of Pictures : " >> $2/$1_Analysed/$1_Static_Features.txt
find $2/$1_Analysed/* -iname "*.jpg" -type f -printf '.' | wc -c  >> $2/$1_Analysed/$1_Static_Features.txt
echo -e "  " >> $2/$1_Analysed/$1_Static_Features.txt

echo -e " Displaying Number of Audio..."
echo -e " Number of Audio : " >> $2/$1_Analysed/$1_Static_Features.txt
find $2/$1_Analysed/* -iname "*.mp3" -type f -printf '.' | wc -c  >> $2/$1_Analysed/$1_Static_Features.txt
echo -e "  " >> $2/$1_Analysed/$1_Static_Features.txt

echo -e " Displaying Number of Videos..."
echo -e " Number of Videos : " >> $2/$1_Analysed/$1_Static_Features.txt
find $2/$1_Analysed/* -iname "*.mp4" -type f -printf '.' | wc -c  >> $2/$1_Analysed/$1_Static_Features.txt
echo -e "  " >> $2/$1_Analysed/$1_Static_Features.txt

echo -e " Displaying Size of the App..."
echo -e " Size of the App : " >> $2/$1_Analysed/$1_Static_Features.txt
du -sh $2/$1_Analysed/ | cut -f -1 >> $2/$1_Analysed/$1_Static_Features.txt
echo -e "  " >> $2/$1_Analysed/$1_Static_Features.txt

echo -e " DONE!"

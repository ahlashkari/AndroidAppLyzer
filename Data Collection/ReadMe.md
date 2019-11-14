#### Data Collection is the first step :
Each script in this forlder is used to collect, label then download the data used for the project.

#### Prerequisites :
Download pyandrozoo

#### Commands to run the scripts :
```
$ python csvtxt.py -c <csv file .csv> -t <text file .txt>
$ python VT_Labeling.py -i <list of hashs to analyse> -o <name of the output file where to put the selected hashs>
$ python3 DownloadHash.py -i <file with the list of Hashs to download>
```

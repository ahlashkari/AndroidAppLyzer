import csv
import argparse
import os
import requests


def fileexists(filepath):
    try:
        if os.path.isfile(filepath):
            return (filepath)
        else:
	    print ("There is no file at:" + filepath)
	    exit()
    except:
	print ("File don't exist")

# This function is to delete deplications :
def delete(txtfile, delfile):
    lines_seen = set() # holds lines already seen
    outfile = open(delfile, "w")
    for line in open(txtfile, "r"):
        if line not in lines_seen: # not a duplicate
            outfile.write(line)
            lines_seen.add(line)
    outfile.close()



def main(): 
    script = argparse.ArgumentParser(description="this script puts the values of a csv file in a text file")
    script.add_argument('-c', '--csvfile', type=fileexists, required=True)
    script.add_argument('-t', '--txtfile', type=fileexists, required=True)
    #script.add_argument('-d', '--delfile', type=fileexists, required=True)
    args = script.parse_args()
    print(" Step 1: From csv to txt ")
    with open(args.csvfile) as csvfile:
        readCSV = csv.reader(csvfile, delimiter=',')
        apks = []
        for row in readCSV:
            apk = row[0]
            file = open(args.txtfile,'a')
            file.write(apk)
            file.write('\n')
            file.close()
        print(" Done.")

    #print(" Step 2: Delete deplicated hashs")
    
    #delete(args.txtfile, args.delfile)
    #print(" Done.")
# execute the program
if __name__ == '__main__':
	main()


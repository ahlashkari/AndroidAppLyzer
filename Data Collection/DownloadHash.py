import pyandrozoo
import csv

def Download(inputfile):
    # The list of hashs can be cerated using the VT_Labeling.py script
    with open(inputfile) as csvfile:
        readCSV = csv.reader(csvfile, delimiter=',')
        apks = []
        for row in readCSV:
            apk = row[0]
            apks.append(apk)
        print(apks)
        print("Hash files list uploaded ...")
    androzoo = pyandrozoo.pyAndroZoo('<IP to access the Androzoo Dataset')
    androzoo.get(apks)
    

def main():
    script = argparse.ArgumentParser(description="You have to provide the CSV file with the list of hash to download as input")
    script.add_argument('-i', '--input', required=True)
    args = script.parse_args()
    Download(args.input)
    print("apks downloaded ...")
    print("Done")

if __name__ == '__main__':
	main()

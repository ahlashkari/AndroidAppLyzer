import requests
import argparse
import os
import csv


def VT_Scan(hash, output):
    url = 'https://www.virustotal.com/vtapi/v2/file/report'
    params = {'apikey': '<VT_IP>', 'resource': hash}
    response = requests.post(url, params=params)
    #print(response.json())
    json_response = response.json()
    res = int(json_response.get('response_code'))  
    if res == None:
        print("Note a VT")
    elif res == 1:
        positives = int(json_response.get('positives'))
        if int(positives) == 0:
            print (hash + ' is Benign')
            file = open(output,'a')
	    file.write(hash)
            file.write('\n')
	    file.close()
        else:
            print (hash +' is Malicious')
    else:
        print(hash + ' Not Recognized by VT')

    
def main():
    script = argparse.ArgumentParser(description="Label a list of hash to benign and malicious using VT then creating a CSV file with a selected list of hash, an example: we only need the benign hashes")
    script.add_argument('-i', '--input', required=False)
    script.add_argument('-o', '--output', required=True)
    args = script.parse_args()
	
    # Cause we need only the benign data from the androzoo data set, we will create a list of it for the download later
    print("\n")
    print(" Step : Cheking with VirusTotal and extracting the begnin data")
    print(".........")
    print("\n")
    with open(args.input) as o:
        for line in o.readlines():
            VT_Scan(line.rstrip(), args.output)
    print("\n")
    print(".........")
    print("Done")
    print("\n")


if __name__ == '__main__':
	main()

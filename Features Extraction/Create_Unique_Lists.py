import re
import csv
import sys

Feature = []
name = ""
with open (sys.argv[1], 'rt') as myfile:  
    for myline in myfile:                 
        Feature.append(myline.rstrip('\n').rstrip(' '))
# use it just to name the csv file
for index, line in enumerate(Feature):
    if " Package :" in str(line):
        for a in range(index+1, index + 100):
            if len(Feature[a]) == 0:
                break
            else:
                name = re.search(r'"([^"]*)"', Feature[a]).group(1)
                if name != None:
                    print(name)
                else:
                    print(" None !!!! ")
print("###################################################################")
print("Analysing App : "+name)
print("\n")
Permissions = []
for index, line in enumerate(Feature):
    if " Permissions :" in str(line):
        for a in range(index+1, index + 100):
            if len(Feature[a]) == 0:
                break
            else:
                try:
                    perm = re.search(r'".*.permission.([^"]*)"', Feature[a]).group(1)
                    Permissions.append("permission."+perm)
                except:
                    print(" None !!!! ")

# Create the Unique Permission List
Per = []
for i in Permissions:
    Per.append(i)
print("List of permission for this app :")
for i in Per:
    print(i)
print("*************************************************************")
for i in Per:
    #print(i)
    if i in open('Unique_Lists/1_List_Permissions.csv').read():
        print("0")
    else:
        print("1")
        with open('Unique_Lists/1_List_Permissions.csv', 'a+') as csvfile:
            csvfile.write(i.encode())
            csvfile.write('\n'.encode())
        csvfile.close()
        print("Added ... ")
print("*************************************************************")
print("\n")
Services = []
for index, line in enumerate(Feature):
    if " Services :" in str(line):
        for a in range(index+1, index + 100):
            if len(Feature[a]) == 0:
                break
            else:
                try:
                    serv = re.search(r'(\w+)Service', Feature[a]).group(1)
                    Services.append(serv+"Service")
                except:
                    print(" None !!!! ")
print("*************************************************************")
Ser = []
for i in Services:
    Ser.append(i)
print("List of services for this app :")
for i in Ser:
    print(i)
print("*************************************************************")
for i in Ser:
    #print(i)
    if i in open('Unique_Lists/2_List_Services.csv').read():
        print("0")
    else:
        print("1")
        with open('Unique_Lists/2_List_Services.csv', 'a+') as csvfile:
            csvfile.write(i.encode())
            csvfile.write('\n'.encode())
        csvfile.close()
        print("Added ... ")
print("*************************************************************")
Actions = []
for index, line in enumerate(Feature):
    if " Intents Action :" in str(line):
        for a in range(index+1, index + 100):
            if len(Feature[a]) == 0:
                break
            else:
                try:
                    actio = re.search(r'".*.action.([^"]*)"', Feature[a]).group(1)
                    Actions.append("action."+actio)
                except:
                    print("None !!!!")
print("*************************************************************")
Act = []
for i in Actions:
    Act.append(i)
print("List of actions for this app :")
for i in Act:
    print(i)
print("*************************************************************")
for i in Act:
    #print(i)
    if i in open('Unique_Lists/3_List_Actions.csv').read():
        print("0")
    else:
        print("1")
        with open('Unique_Lists/3_List_Actions.csv', 'a+') as csvfile:
            csvfile.write(i.encode())
            csvfile.write('\n'.encode())
        csvfile.close()
        print("Added ... ")
print("*************************************************************")
Categories = []
for index, line in enumerate(Feature):
    if " Intents Category :" in str(line):
        for a in range(index+1, index + 100):
            if len(Feature[a]) == 0:
                break
            else:
                try:
                    cate = re.search(r'".*.category.([^"]*)"', Feature[a]).group(1)
                    Categories.append("category."+cate)
                except:
                    print("None !!!!")
print("*************************************************************")
Cat = []
for i in Categories:
    Cat.append(i)
print("List of categories for this app :")
for i in Cat:
    print(i)
print("*************************************************************")
for i in Cat:
    #print(i)
    if i in open('Unique_Lists/4_List_Categories.csv').read():
        print("0")
    else:
        print("1")
        with open('Unique_Lists/4_List_Categories.csv', 'a+') as csvfile:
            csvfile.write(i.encode())
            csvfile.write('\n'.encode())
        csvfile.close()
        print("Added ... ")

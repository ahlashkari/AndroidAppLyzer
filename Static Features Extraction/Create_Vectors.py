import re
import csv
import sys

Feature = []
name = ""

with open (sys.argv[1], 'rt') as myfile:  
    for myline in myfile:                 
        Feature.append(myline.rstrip('\n').rstrip(' '))
end = sys.argv[2]        
sp1=sys.argv[1].split(end)
sp2=sp1[1].split('.')
print(sp2[0])

print(" Activities ***************************")
Activities = []
for index, line in enumerate(Feature):
    if " Activities :" in str(line):
        for a in range(index+1, index + 100):
            if len(Feature[a]) == 0:
                break
            else:
                try:
                    act = re.search(r'android:name="([^"]*)"', Feature[a]).group(1)
                    Activities.append(act)
                except:
                    print(" None !!!!! ")
print(" Services *************************")
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
print(" Permissions ****************************")
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
print(" Actions ***************************")
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
print(" Categories ***************************")
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
print(" Meta-Data **************************")
Meta = []
for index, line in enumerate(Feature):
    if " Meta-Data :" in str(line):
        for a in range(index+1, index + 100):
            if len(Feature[a]) == 0:
                break
            else:
                try:
                    met = re.search(r'"([^"]*)"', Feature[a]).group(1)
                    Meta.append(met)
                except:
                    print("None !!!!!")
print(" Providers **************************")
Providers = []
for index, line in enumerate(Feature):
    if " Providers :" in str(line):
        for a in range(index+1, index + 100):
            if len(Feature[a]) == 0:
                break
            else:
                try:
                    porv = re.search(r'android:name="([^"]*)"', Feature[a]).group(1)
                    Providers.append(porv)
                except:
                    print("None !!!!")
print(" receivers **************************")
receivers = []
for index, line in enumerate(Feature):
    if " Receivers :" in str(line):
        for a in range(index+1, index + 100):
            if len(Feature[a]) == 0:
                break
            else:
                try:
                    Ress = re.search(r'android:name="([^"]*)"', Feature[a]).group(1)
                    receivers.append(Ress)
                except:
                    print("None !!!!")
print(" Number of Icons **************************")
Hardware = []
for index, line in enumerate(Feature):
    if " Number of Icons :" in str(line):
        for a in range(index+1, index + 100):
            if len(Feature[a]) == 0:
                break
            else:
                Hardware.append(Feature[a])
print(" Number of Audio ****************************")
for index, line in enumerate(Feature):
    if " Number of Audio :" in str(line):
        for a in range(index+1, index + 100):
            if len(Feature[a]) == 0:
                break
            else:
                Hardware.append(Feature[a])

print(" Number of Videos ***************************")
for index, line in enumerate(Feature):
    if " Number of Videos :" in str(line):
        for a in range(index+1, index + 100):
            if len(Feature[a]) == 0:
                break
            else:
                Hardware.append(Feature[a])

print(" Size of the App ***************************")
for index, line in enumerate(Feature):
    if " Size of the App :" in str(line):
        for a in range(index+1, index + 100):
            if len(Feature[a]) == 0:
                break
            else:
                Hardware.append(int(float(Feature[a][:-1])))
print(" Add Hardware to the Vector ******************************")
Values =[]

Values.append(sp2[0])
for i in Hardware:
    Values.append(i)
Values.append(len(Activities))
Values.append(len(Meta))
Values.append(len(Services))
Values.append(len(Permissions))
Values.append(len(Actions))
Values.append(len(Providers))
Values.append(len(receivers))
Values.append(len(Categories))


print(" Add Permissions to the Vector **************************")
with open('Unique_Lists/1_List_Permissions.csv') as csvFile:
    dataPer = csvFile.readlines()
csvFile.close()
for i in dataPer:
    if i.strip() in Permissions:
        Values.append(1)
    else:
        Values.append(0)

with open('Unique_Lists/3_List_Actions.csv') as csvFile:
    dataAct = csvFile.readlines()
csvFile.close()
for i in dataAct:
    if i.strip() in Actions:
        Values.append(1)
    else:
        Values.append(0)

with open('Unique_Lists/2_List_Services.csv') as csvFile:
    dataSer = csvFile.readlines()
csvFile.close()
for i in dataSer:
    if i.strip() in Services:
        Values.append(1)
    else:
        Values.append(0)

with open('Unique_Lists/4_List_Categories.csv') as csvFile:
    dataCat = csvFile.readlines()
csvFile.close()
for i in dataCat:
    if i.strip() in Categories:
        Values.append(1)
    else:
        Values.append(0)

for i in dataSer:
    print(i.strip())
print("############################")
for i in Services:
    print(i)
        

print(" Create the Vector with the package name ****************")
with open('Output_CSV_Files/Static_Binary_Features.csv', 'a+') as csvFile:
    writer = csv.writer(csvFile)
    writer.writerow(Values)
csvFile.close()

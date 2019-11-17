import re

import csv

import sys



Feature = []

name = ""



with open (sys.argv[1], 'rt') as myfile:  

    for myline in myfile:                 

        Feature.append(myline.rstrip('\n').rstrip(' '))

        



print(" Package **************************")

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



print(name)

print(" Activities ***************************")

# Take the number of the activities in the app

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

                    serv = re.search(r'android:name="([^"]*)"', Feature[a]).group(1)

                    Services.append(serv)

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

                    perm = re.search(r'"([^"]*)"', Feature[a]).group(1)

                    Permissions.append(perm)

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

                actio = re.search(r'"([^"]*)"', Feature[a]).group(1)

                if actio != None :

                    Actions.append(actio)

                    #print(actio)

                else:

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

                    cate = re.search(r'"([^"]*)"', Feature[a]).group(1)

                    Categories.append(cate)

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

                met = re.search(r'"([^"]*)"', Feature[a]).group(1)

                if met != None:

                    Meta.append(met)

                else:

                    print("None !!!!!")





print(" Providers **************************")

Providers = []

for index, line in enumerate(Feature):

    if " Providers :" in str(line):

        for a in range(index+1, index + 100):

            if len(Feature[a]) == 0:

                break

            else:

                porv = re.search(r'android:name="([^"]*)"', Feature[a]).group(1)

                if porv !=  None:

                    Providers.append(porv)

                else:

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



#print(" Add Package Name to the Vector ******************************")

Values =[]

#Values.append(name)

print(" Add Hardware to the Vector ******************************")

for i in Hardware:

    Values.append(i)



print(" Add Activities to the Vector ***************************")

Values.append(len(Activities))



print(" Add Meta-Data to the Vector *****************************")

Values.append(len(Meta))



print(" Add Providers to the Vector *****************************")

Values.append(len(Providers))



print(" Add Recievers to the Vector *****************************")

Values.append(len(receivers))



print(" Add Permissions to the Vector **************************")

PPPPP = []

for i in open('Unique_Lists/1_List_Permissions.csv'):

    rows = str(i) 

    PPPPP.append(rows)



for i in PPPPP:

    if i.strip() in Permissions:

        Values.append(1)

    else:

        Values.append(0)



print(" Add Services to the Vector **************************")

SSSSS = []

for i in open('Unique_Lists/2_List_Services.csv'):

    rows = str(i) 

    SSSSS.append(rows)



for i in SSSSS:

    if i.strip() in Services:

        Values.append(1)

    else:

        Values.append(0)





print(" Add Actions to the Vector **************************")

AAAAA = []

for i in open('Unique_Lists/3_List_Actions.csv'):

    rows = str(i) 

    AAAAA.append(rows)



for i in AAAAA:

    if i.strip() in Actions:

        Values.append(1)

    else:

        Values.append(0)



print(" Add Categories to the Vector **************************")

CCCCC = []

for i in open('Unique_Lists/4_List_Categories.csv'):

    rows = str(i) 

    CCCCC.append(rows)



for i in CCCCC:

    if i.strip() in Categories:

        Values.append(1)

    else:

        Values.append(0)



print(" Create the Vector with the package name ******************************")

with open('Output_CSV_Files/Static_features_binary.csv', 'a+') as csvFile:

    writer = csv.writer(csvFile)

    writer.writerow(Values)

csvFile.close()

           




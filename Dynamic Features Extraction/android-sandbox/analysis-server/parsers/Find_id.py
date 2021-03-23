import os
from os import listdir
import fnmatch

#direc = "/home/ltaheri/Desktop/"
#path = "/media/ltaheri/SeagateExpansionDrive/"
path = "/home/Abir/espionage/analysis-server/Capturing/"



def files(direc):
    c = 0
    for file in os.listdir(direc):
        if os.path.isfile(os.path.join(direc, file)):
            c = c + 1
        else:
            yield file


matches = []
folders = []
for f1 in files(path):
    if f1 != "cleanstate-factory-ph1" and f1 != "cleanstate-factory-ph2" and f1 != "cleanstate-factory-ph3" and f1 != "Android":
        for f2 in files(path + f1):

            for root, dirnames, filenames in os.walk(path + str(f1) + '/' + str(f2) + '/before/'):
                for filename in fnmatch.filter(filenames, 'permissions'):
                    matches.append(path + str(f1) + '/' + str(f2) + '/before/' + filename)
                    folders.append(path + str(f1) + '/' + str(f2) + '/before/')   ###must change everytime


print(len(matches))

print(len(folders))

print(type(matches[0]))

print(matches[0])


i = 0
for file in matches:
    # with open(file, 'r') as f3:
    # s = 'cat {param1} | grep "userId" > {output}'.format(param1= file, output = folders[i] + 'id')
    s = 'grep "userId" {param1} > {output}'.format(param1=file, output=folders[i] + 'id')
    os.system(s)
    i = i + 1
# print s

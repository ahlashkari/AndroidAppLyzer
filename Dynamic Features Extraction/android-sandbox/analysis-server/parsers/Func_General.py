import os
import fnmatch
import csv
import re


class FuncGeneral(object):

    def files(self, direc):
        c = 0
        for file in os.listdir(direc):
            if os.path.isfile(os.path.join(direc, file)):
                c = c + 1
            else:
                yield file

    def Id_count(self, st):
        Id = []
        space_start_flg = False
        for i in range(len(st)):
            if space_start_flg == False:
                if st[i] != " ":
                    space_start_flg = True
                else:
                    continue
            if (st[i] == "u" or st[i] == "s" or st[i] == "e" or st[i] == "r" or st[i] == "I" or st[i] == "d" or
                    st[i] == "="):
                continue
            if st[i] != " ":
                Id.append(st[i])

            else:
                return Id


    def userId(self, path):  # ###Read userid ##return as string
        Id = []
        with open(path, 'r') as f2:
            lines = f2.readlines()
            if len(lines) > 0:
                for line in lines:
                    Id = self.Id_count(line)  # call ID_count

                return Id

            else:
                Id.append('9')
                Id.append('9')
                Id.append('9')
                return Id

    # Read userid

    # Find matches of files based on keywords

    def find_matches(self, path, matches, IDs, key_str, folder_typ):
        for f1 in self.files(path):
            for root, dirnames, filenames in os.walk(path + str(f1) + '/' + folder_typ):
                for filename in fnmatch.filter(filenames, key_str):
                    matches.append(path + str(f1) + '/' + folder_typ + filename)
                    for filename2 in fnmatch.filter(filenames, 'id'):
                        IDs.append(self.userId(os.path.join(root, filename2)))

    def cov_id_toInt(self, Id, len_id):
        i = len(Id)
        num = 0
        Pow = 0
        j = len_id
        while j > 0:
            tmp = int(Id[i - 1])
            num = num + tmp * (10 ** Pow)
            Pow = Pow + 1
            i = i - 1
            j = j - 1
        return num

    def find_info(self, file):
        m = re.search("[0-9]{2}_[0-9]{2}_[0-9]{4}-([^-/]+)-([^-/]+)-([^-/]+)", file)
        cat = m.group(1)
        fam = m.group(2)
        has = m.group(3)
        '''
        cat = file.split("/", 6)[5]

        if cat == "Benign":
            str1 = file.split("-", 5)[-1]
            has = str1.split("/", 2)[0]
            fam = "None"

        else:
            str1 = file.split("-", 5)[-1]
            has = str1.split("/", 2)[0]

            st5 = str(file).split("-", 2)[2]
            fam = st5.split("-", 1)[0]
        '''
        return cat, fam, has
    # read header line from csv file

    def read_hdr_csv(self, direc, hdr_list, c):
        with open(direc + c, 'r') as f:
            reader = csv.reader(f)
            for row in reader:
                hdr_list.append(row)
    # save csv rows

    def write_rows_csv(self, direc, perm_tb, c):
        with open(direc + c + ".csv", "w") as f:
            writer = csv.writer(f)
            writer.writerows(perm_tb)



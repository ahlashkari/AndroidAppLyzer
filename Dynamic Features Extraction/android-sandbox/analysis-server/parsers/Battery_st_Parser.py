import csv
import Func_General

class Battery(object):
    src_direc = ""
    dst_direc = ""
    hdrs_direc = ""
    Func_General = None

    def __init__(self, src_direc, dst_direc, hdrs_direc):
        self.matches = []
        self.IDs = []
        self.Battery_tbl = []
        self.src_direc = src_direc
        self.dst_direc = dst_direc
        self.hdrs_direc = hdrs_direc
        self.unique = []
        self.Func_General = Func_General.FuncGeneral()

    def removeEverything(self, str):
        return str.replace("\n", "").replace("\r", "").rstrip()

    def dic_array_to_csv(self, Network, c):
        for k in range(len(Network)):
            with open(self.dst_direc + 'Battery' + c + '_sample' + str(k) + '_' + str(Network[k]['MD5']) + '.csv', 'w') as csv_file:
                writer = csv.writer(csv_file)

                # write hdrs
                tmp = []
                tmp.append('Sample_Num')
                tmp.append('pow')
                for x in range(len(self.unique[0])):
                    tmp.append(self.unique[0][x])

                tmp.append('<Family>')
                tmp.append('<Category>')
                tmp.append('<MD5>')
                writer.writerow(tmp)  # save all headers

                # write data
                tmp2 = []
                tmp2.append('sample' + str(k))
                tmp2.append(Network[k]['pow'])
                for z in range(len(Network[k]['lock_num'])):
                    tmp2.append(Network[k]['lock_num'][z])

                tmp2.append(Network[k]['fam'])
                tmp2.append(Network[k]['cat'])
                tmp2.append(Network[k]['MD5'])
                writer.writerow(tmp2)  # save all battery data for each sample

    def find_batt(self, f, sample_batt, ID, file):
        lines = f.readlines()

        cat, fam, has = self.Func_General.find_info(file)

        flg_found = False
        es_pow = '0'
        lock = []
        lock_num = [0] * len(self.unique[0])
        for line in lines:
            if flg_found == False:
                if 'u0a' + str(ID) in line:
                    flg_found = True
                    continue

                if "  All partial wake locks:" in line:
                    flg_found = True
                    continue

                if "Estimated power use (mAh):" in line:
                    flg_found = True
                    continue

            if flg_found == True:  # already uid is found and this is the next line

                if "Uid u0a" + str(ID) in line:
                    es_pow = line.split(": ", 1)[1]
                    flg_found = False
                    continue

                if "    Wake lock " in line:
                    tmp_line = line.split("lock ", 1)[1]
                    for q in range(len(self.unique[0])):
                        #print("/a/" + removeEverything(tmp_line) + "/a/ in /b/" + self.unique[0][q] + "/b/")
                        if self.removeEverything(tmp_line) in self.unique[0][q]:
                            lock_num[q] = lock_num[q] + 1
                            # print(self.unique[0][q])

                    continue

                if "  Wake lock " + 'u0a' + str(ID) in line:
                    tmp_line = line.split('u0a' + str(ID), 1)[1]
                    for q in range(len(self.unique[0])):
                        if self.removeEverything(tmp_line) in self.unique[0][q]:
                            lock_num[q] = lock_num[q] + 1
                            # print(self.unique[0][q])
                    continue

                else:
                    flg_found = False

        mydata = {'MD5': has, 'pow': es_pow, 'lock': lock, 'cat': cat, 'fam': fam, 'lock_num': lock_num}

        sample_batt.append(mydata)

    def run(self):
        self.Func_General.find_matches(self.src_direc, self.matches, self.IDs, "battery", "afterinstall/")

        self.Func_General.read_hdr_csv(self.hdrs_direc, self.unique, "Battery_afterinstall_hdrs.csv")  # server fix hdr tbl address
        c = 0
        for file in self.matches:
            Id = self.Func_General.cov_id_toInt(self.IDs[c], 3)
            #print(Id)
            c = c + 1
            if Id != 999:  # a selected number as id that never used for non specified files
                with open(file, 'r') as f:
                    sample_batt = []
                    self.find_batt(f, sample_batt, Id, file)
                    if 0 < len(sample_batt):
                        self.Battery_tbl.append(sample_batt[0])

        self.dic_array_to_csv(self.Battery_tbl, '_afterinstall_tbl')
        
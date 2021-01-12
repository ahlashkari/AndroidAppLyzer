import csv
import Func_General

class Intent(object):
    src_direc = ""
    dst_direc = ""
    hdrs_direc = ""
    Func_General = None

    def __init__(self, src_direc, dst_direc, hdrs_direc):
        self.headers_csv = []
        self.matches = []
        self.IDs = []
        self.Intent_target_tbl = []
        self.src_direc = src_direc
        self.dst_direc = dst_direc
        self.hdrs_direc = hdrs_direc
        self.Func_General = Func_General.FuncGeneral()

    def find_intent(self, f, number, hdr_list):
        lines = f.readlines()
        for line in lines:
            tmp_line = line.replace(" ", "")
            for index in range(len(hdr_list)):
                if str(hdr_list[index]) in tmp_line:
                    number[index] = number[index] + 1
                else:
                    continue

    def creat_tbl(self, f02, f03, hdr_list, intent_tbl):
        intent_num = [0] * len(hdr_list)
        self.find_intent(f03, intent_num, hdr_list)  # number of each granted permissions
        catt, famm, hass = self.Func_General.find_info(f02)

        intent_num[len(hdr_list) - 3] = famm
        intent_num[len(hdr_list) - 2] = catt
        intent_num[len(hdr_list) - 1] = hass

        intent_tbl.append(intent_num)

    def write_row_csv(self, direc, tb, c):
        with open(direc + c + ".csv", "w") as f:
            writer = csv.writer(f)
            writer.writerow(self.headers_csv[0])
            writer.writerow(tb)

    def run(self):
        self.Func_General.find_matches(self.src_direc, self.matches, self.IDs, "AndroidManifest.xml", "afterinstall/")

        self.Func_General.read_hdr_csv(self.hdrs_direc, self.headers_csv, "Intent_afterinstall_hdrs.csv")  # server fix hdr tbl address

        self.headers_csv[0].append("<family>")
        self.headers_csv[0].append("<category>")
        self.headers_csv[0].append("<MD5>")

        for f02 in self.matches:
            with open(f02, 'r') as f03:
                self.creat_tbl(f02, f03, self.headers_csv[0], self.Intent_target_tbl)

        for i in range(len(self.Intent_target_tbl)):
            self.write_row_csv(self.dst_direc, self.Intent_target_tbl[i], 'Intent_afterinstall_tbl_' + 'sample' + str(i) +
                               '_' + str(self.Intent_target_tbl[i][-1]))

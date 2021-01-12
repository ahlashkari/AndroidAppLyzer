import Func_General
import csv


class PermissionStatic(object):
    src_direc = ""
    dst_direc = ""
    hdrs_direc = ""
    Func_General = None

    def __init__(self, src_direc, dst_direc, hdrs_direc):
        self.merged_headers = []
        self.matches = []
        self.IDs = []
        self.Perm_taget_tbl = []
        self.src_direc = src_direc
        self.dst_direc = dst_direc
        self.hdrs_direc = hdrs_direc
        self.Func_General = Func_General.FuncGeneral()

    # add sample Perm list to rows
    def find_perm(self, f, number, hdr_list):
        lines = f.readlines()
        for line in lines:
            tmp_line = line.replace("uses-permission: name='", "")
            tmp_line = tmp_line.replace("permission: ", "")
            tmp_line = tmp_line.replace("uses-name=", "")
            tmp_line = tmp_line.replace("'", "")
            tmp_line = tmp_line.replace(" ", "")
            for index in range(len(hdr_list)):
                if hdr_list[index] in tmp_line:
                    number[index] = number[index] + 1
                else:
                    continue

    def creat_tbl(self, f02, f03, hdr_list, Perm_tbl):
        perm_num = [0] * len(hdr_list)
        self.find_perm(f03, perm_num, hdr_list)  # number of each granted permissions
        catt, famm, hass = self.Func_General.find_info(f02)
        perm_num[len(hdr_list) - 3] = famm
        perm_num[len(hdr_list) - 2] = catt
        perm_num[len(hdr_list) - 1] = hass

        Perm_tbl.append(perm_num)

    def write_row_csv(self, direc, tb, c):
        with open(direc + c + ".csv", "w") as f:
            writer = csv.writer(f)
            writer.writerow(self.merged_headers[0])
            writer.writerow(tb)

    def run(self):
        self.Func_General.find_matches(self.src_direc, self.matches, self.IDs, "permissionsFromApk", "afterinstall/")

        self.Func_General.read_hdr_csv(self.hdrs_direc, self.merged_headers, "Perm_afterinstall_hdrs.csv")
        # server fix hdr tbl address

        # variables
        self.merged_headers[0].append("<family>")
        self.merged_headers[0].append("<category>")
        self.merged_headers[0].append("<MD5>")

        for f02 in self.matches:
            with open(f02, 'r') as f03:
                self.creat_tbl(f02, f03, self.merged_headers[0], self.Perm_taget_tbl)

        for i in range(len(self.Perm_taget_tbl)):
            self.write_row_csv(self.dst_direc, self.Perm_taget_tbl[i], 'Perm_afterinstall_tbl_' + 'sample' + str(i) +
                               '_' + str(self.Perm_taget_tbl[i][-1]))

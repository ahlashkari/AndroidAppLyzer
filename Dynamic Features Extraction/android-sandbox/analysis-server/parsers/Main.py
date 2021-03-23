import sys

import Battery_st_Parser
import Permission_St_Parser
import Intent_Parser
import Func_General


src_direc = sys.argv[1]
dst_direc = sys.argv[1]
hdrs_direc = sys.argv[2]

if __name__ == '__main__':

    # creates classes
    permission_parser = Permission_St_Parser.PermissionStatic(src_direc, dst_direc, hdrs_direc)
    battery_parser = Battery_st_Parser.Battery(src_direc, dst_direc, hdrs_direc)
    intent_parser = Intent_Parser.Intent(src_direc, dst_direc, hdrs_direc)

    # running methods
    permission_parser.run()
    battery_parser.run()
    intent_parser.run()


#!/usr/bin/env python3

import os
import shlex
import signal
import subprocess
import sys
import time
import traceback

import frida

class FridaHelper(object):
    def __init__(self):
        self.dev = None
        self.app = None
        self.session = None
        self.script = None
        self.output = None

    @staticmethod
    def _ensure_frida_server(adb_cmd, device, frida_server_exe='/data/local/tmp/frida-server'):
        print('frida-helper: Checking for frida-server')
        sys.stdout.flush()
        ps = subprocess.run([adb_cmd, '-s', device, 'shell', 'ps'], stdout=subprocess.PIPE, check=True)
        if 'frida-server' in ps.stdout.decode('utf-8'):
            return
        else:
            # TODO what about other su dialects?
            print('frida-helper: frida-server is not running, starting now...')
            sys.stdout.flush()
            subprocess.run([adb_cmd, '-s', device, 'shell', 'su root ' + shlex.quote(frida_server_exe) + ' -D < /dev/null &> /dev/null &'], check=True)
            time.sleep(1)

    def start_capture(self, device, package, script_path, output_file, adb_cmd):
        self._ensure_frida_server(adb_cmd, device)
        scr_list = []
        for root, _dirs, files in os.walk(script_path):
            for fn in files:
                if fn.endswith('.js'):
                    print('frida-helper: Found script file', os.path.join(root, fn))
                    with open(os.path.join(root, fn), 'r') as f:
                        scr_list.append(f.read())
        scr = '\n'.join(scr_list)
        print('frida-helper: Starting capture...')
        sys.stdout.flush()
        self.dev = frida.get_device(device)
        self.app = self.dev.spawn([package])
        self.session = self.dev.attach(self.app)
        self.session.on('detached', self._on_session_detach)
        self.script = self.session.create_script(scr)
        self.output = open(output_file, 'a')
        self.output.write('#NEW SESSION#\n')
        self.script.on('message', self._on_message)
        self.script.load()
        self.dev.resume(self.app)
        print('frida-helper: Capture started')
        print('#STARTUP OK#')
        # Ensure on-time message delivery
        sys.stdout.flush()

    def stop_capture(self):
        print('frida-helper: Stopping capture...')
        if self.script is not None:
            self.script.unload()
        if self.session is not None:
            self.session.detach()
        if self.dev is not None:
            self.dev.kill(self.app)
        if self.output is not None:
            self.output.close()
        print('frida-helper: Capture stopped')

    def _on_message(self, message, data):
        if message['type'] == 'error':
            print('frida-helper: Error on script execution')
            print('===Begin of stack trace===')
            print(message.get('stack'))
            print('===End of stack trace===')
            sys.stdout.flush()
        elif message['type'] == 'send':
            self.output.write(message['payload'])
            self.output.write('\n')
        else:
            print("frida-helper: Unhandled message:", message)
            sys.stdout.flush()

    def _on_session_detach(self, session, reason):
        print('frida-helper: Session detached session={}'.format(session))
        if reason is not None:
            print('frida-helper: reason={}'.format(reason))
        sys.stdout.flush()
        if reason != 'application-requested':
            # Close the file (if any) and quit immediately with error
            if self.output is not None:
                self.output.close()
            sys.exit(1)


_INSTANCE = FridaHelper()


def on_exit(sig, frame):
    _INSTANCE.stop_capture()
    sys.exit(0)

if __name__ == '__main__':
    signal.signal(signal.SIGTERM, on_exit)
    signal.signal(signal.SIGINT, on_exit)

    if len(sys.argv) < 6:
        print('Usage:', sys.argv[0], 'device package script-path output-file path-to-adb-exe')
        print('NOTE: This program is intended to be used within android-sandbox and should not be called directly.')
        sys.exit(2)

    try:
        _INSTANCE.start_capture(*sys.argv[1:6])
    except Exception:
        print('frida-helper: Error during startup')
        print(traceback.format_exc())
        sys.stdout.flush()
        _INSTANCE.stop_capture()
        sys.exit(1)

    while True:
        time.sleep(10)

#!/usr/bin/env python3

import json
import random
import string
import sys

import pymongo

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('Usage {} <web-or-analysis-server-config> <user>'.format(sys.argv[0]))
        sys.exit(1)

    with open(sys.argv[1], 'r') as f:
        config = json.load(f)

    _alphanumeric = string.ascii_lowercase + string.digits
    random_email = ''.join(random.choice(_alphanumeric) for _ in range(8))

    client = pymongo.MongoClient(
        config['dbHost'],
        port=config['dbPort'],
        username=config['dbUser'],
        password=config['dbPassword'],
        authSource=config['dbName']
    )

    try:
        db = client[config['dbName']]

        db.users.insert_one({
            'email': '{}@dummy.example.com'.format(random_email),
            'username': sys.argv[2],
            'tags': ['nologin'],
            'salt': '0' * 2 * 32,
            'hash': '0' * 2 * 512
        })
    finally:
        client.close()

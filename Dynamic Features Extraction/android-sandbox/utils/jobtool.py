#!/usr/bin/env python3

import enum
import functools
import json
import pprint
import sys

import pymongo

class JobState(enum.IntEnum):
    error = 0
    pending_approval = 1
    queued = 2
    running = 3
    done = 4

def _resolve_analysis_state(v):
    # Test for names
    try:
        state_num = JobState[v]
    except KeyError:
        raise ValueError('Unknown job state {}'.format(v))
    return state_num
    
def do_list(argv, db):
    cond = {}
    verbose = False
    for a in argv:
        if a.startswith('state='):
            cond['state'] = _resolve_analysis_state('='.join(a.split('=')[1:]))
        if a == 'verbose':
            verbose = True
    if verbose:
        for ent in db.analyses.find(cond, {'sha256': True, 'path': True, 'state': True}):
            print('\t'.join((ent['sha256'], ent['path'], JobState(ent['state']).name)))
    else:
        for ent in db.analyses.find(cond, {'sha256': True}):
            print(ent['sha256'])

def do_info(argv, db):
    if len(argv) == 0:
        print('SHA256 of the apk must be specified.')
        return
    for sha in argv:
        result = db.analyses.find_one({'sha256': sha})
        if result is None:
            print('Analysis {} not found'.format(sha))
        else:
            pprint.pprint(result)

def do_delete(argv, db):
    if len(argv) == 0:
        print('Nothing to delete')
        return
    cond = {}
    count = 0
    if argv[0].startswith('state='):
        count += db.analyses.delete_many({'state': _resolve_analysis_state('='.join(argv[0].split('=')[1:]))}).deleted_count
    else:
        # TODO delete every matches in a single pass?
        for sha in argv:
            count += db.analyses.delete_one({'sha256': sha}).deleted_count
    print('Removed {} analyses'.format(count))

def do_empty(db):
    count = db.analyses.delete_many({}).deleted_count
    print('Removed {} analyses'.format(count))

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('Usage {} <web-or-analysis-server-config> <list|info|delete|empty> [sha256]'.format(sys.argv[0]))
        sys.exit(1)

    with open(sys.argv[1], 'r') as f:
        config = json.load(f)

    client = pymongo.MongoClient(
        config['dbHost'],
        port=config['dbPort'],
        username=config['dbUser'],
        password=config['dbPassword'],
        authSource=config['dbName']
    )

    dispatch = {
        'list': functools.partial(do_list, sys.argv[3:]),
        'info': functools.partial(do_info, sys.argv[3:]),
        'delete': functools.partial(do_delete, sys.argv[3:]),
        'empty': do_empty
    }

    if sys.argv[2] not in dispatch:
        print('Unknown action {}'.format(sys.argv[2]))
        sys.exit(1)

    try:
        db = client[config['dbName']]
        dispatch[sys.argv[2]](db)
    finally:
        client.close()

#!/bin/sh

DATADIR=./st-poa

# if no password file, assume empty
touch pw

geth --datadir "$DATADIR" --gasprice 0 --etherbase 0 --unlock 0 --password pw --rpc --maxpeers 0 --mine --rpcapi eth,web3,personal console

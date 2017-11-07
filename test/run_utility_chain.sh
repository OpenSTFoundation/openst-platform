#!/bin/sh

DATADIR=./st-poa-utility

# if no password file, assume empty
touch pwutility

geth --datadir "$DATADIR" --port 30301 --rpcport 8546 --ws --wsport 18546 --wsorigins "*" --gasprice 0 --etherbase 0 --unlock 0 --password pwutility --rpc --maxpeers 0 --mine --rpcapi eth,web3,personal console

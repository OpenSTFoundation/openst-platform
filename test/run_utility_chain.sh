#!/bin/sh

DATADIR=./st-poa-utility
LOCAL_NETWORK_ID="--networkid 20171010"

# if no password file, assume empty
touch pwutility

geth --datadir "$DATADIR" $LOCAL_NETWORK_ID --port 30301 --rpcport 9546 --ws --wsport 19546 --wsorigins "*" --gasprice 0 --targetgaslimit 90000000009 --etherbase 0 --unlock 0 --password pwutility --rpc --maxpeers 0 --mine --minerthreads 1 --rpcapi net,eth,web3,personal

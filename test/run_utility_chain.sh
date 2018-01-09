#!/bin/sh

DATADIR=./st-poa-utility
LOCAL_NETWORK_ID="--networkid 20171010"

geth --datadir "$DATADIR" $LOCAL_NETWORK_ID --port 30301 --rpcport 9546 --rpcaddr 127.0.0.1 --ws --wsport 19546 --wsorigins "*" --gasprice 0 --targetgaslimit 10000000 --etherbase 0 --unlock 0 --password pw --rpc --maxpeers 0 --mine --minerthreads 1 --rpcapi net,eth,web3,personal

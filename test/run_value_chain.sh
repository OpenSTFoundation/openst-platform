#!/bin/sh

DATADIR=./st-poa-value
LOCAL_NETWORK_ID="--networkid 20171011"

geth --datadir "$DATADIR" --rpcport 8545 --gasprice 0 --targetgaslimit 10000000 --etherbase 0 --unlock 0 --password pw --ws --wsport 18545  --wsorigins "*" --rpc --maxpeers 0 --mine $LOCAL_NETWORK_ID --minerthreads 2 --rpcapi net,eth,web3,personal

#!/bin/sh

DATADIR=./st-poa-utility
LOCAL_NETWORK_ID="--networkid 20171010"

# if no password file, assume empty
touch pwutility

geth --datadir "$DATADIR" $LOCAL_NETWORK_ID --port 30301 --rpcport 8546 --ws --wsport 18546 --wsorigins "*" --gasprice 0 --etherbase 0 --unlock 0 --password pwutility --rpc --maxpeers 0 --mine --rpcapi net,eth,web3,personal console

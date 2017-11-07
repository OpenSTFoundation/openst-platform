#!/bin/sh

DATADIR=./st-poa-value

# if no password file, assume empty
touch pwvalue

geth --datadir "$DATADIR" --rpcport 8545 --gasprice 0 --etherbase 0 --unlock 0 --password pwvalue --ws --wsport 18545 --wsorigins "*" --rpc --maxpeers 0 --mine --rpcapi eth,web3,personal console

#!/bin/sh

DATADIR=./st-poa

mkdir -p "$DATADIR"

rm -r "$DATADIR/geth/chaindata"

geth --datadir "$DATADIR" init poa-genesis.json


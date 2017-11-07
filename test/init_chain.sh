#!/bin/sh

DATADIRVALUE=./st-poa-value
DATADIRUTILITY=./st-poa-utility

mkdir -p "$DATADIRVALUE"
mkdir -p "$DATADIRUTILITY"

rm -rf "$DATADIRVALUE/geth"
rm -rf "$DATADIRUTILITY/geth"


geth --datadir "$DATADIRVALUE" init poa-genesis-value.json
geth --datadir "$DATADIRUTILITY" init poa-genesis-utility.json


#!/bin/sh

DATADIR=./st-poa

# if no password file, create empty
touch pw

mkdir -p "$DATADIR"

echo SimpleTokenFoundation:
geth --datadir "$DATADIR" account new --password pw | grep 'Address:' | perl -ne 's/.*?{(.{40})}/$1/; print'

echo PepoBank:
geth --datadir "$DATADIR" account new --password pw | grep 'Address:' | perl -ne 's/.*?{(.{40})}/$1/; print'

echo StagingPepoBank:
geth --datadir "$DATADIR" account new --password pw | grep 'Address:' | perl -ne 's/.*?{(.{40})}/$1/; print'

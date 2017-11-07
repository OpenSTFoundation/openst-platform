#!/bin/sh
DATADIRVALUE=./st-poa-value
DATADIRUTILITY=./st-poa-utility
ADDRESS_FILE=./new_addresses

echo "Init/Re-Init chain..."
sh ./init_chain.sh
echo "" > ./pw
echo "" > $ADDRESS_FILE
echo "...Done Init"


echo "Generate new addresses..."
#Foundation Address
geth --datadir "$DATADIRVALUE" account new --password ./pw >> $ADDRESS_FILE

#Admin Address
geth --datadir "$DATADIRVALUE" account new --password ./pw >> $ADDRESS_FILE

#Member Company Address
geth --datadir "$DATADIRVALUE" account new --password ./pw >> $ADDRESS_FILE

echo "...New addresses generated"

echo "Sync keystores"
#Copy all 
for i in `ls $DATADIRVALUE/keystore`
do
cp $DATADIRVALUE/keystore/$i $DATADIRUTILITY/keystore/$i
done
echo "...keystores synced"


#Invoke JS script to init addresses in various JSON files.
echo "Populate configs..."
node ./_init_addresses.js $ADDRESS_FILE
#clean-up $ADDRESS_FILE
rm $ADDRESS_FILE
echo "...configs populated"

echo "Re-Init chain with updated config..."
sh ./init_chain.sh
echo "...Done Re-Init"
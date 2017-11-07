#!/bin/sh
URL="http://localhost:3000"
test $# -eq 1 && URL=$1

ADDR=`curl -s $URL/newkey | egrep -oi '0x[0-9a-f]+'`
echo User = $ADDR
ADDR2=`curl -s $URL/newkey | egrep -oi '0x[0-9a-f]+'`
echo User2 = $ADDR2

curljson()
{
    echo "$1"
    curl -s --user acme:acmesecret "$URL$1"
    echo
}

# sanity check
COIN="ACME"
curljson "/$COIN/symbol"
curljson "/$COIN/name"
curljson "/$COIN/decimals"
BANK=`curljson /$COIN/reserve | egrep -oi '0x[0-9a-f]+'`
curljson "/$COIN/approve?sender=$BANK&spender=$ADDR&value=11"
# {"data": "e8576eea-6ad7-4c1c-bfba-a439b26be242"}
curljson "/$COIN/transferFrom?sender=$ADDR&from=$BANK&to=$ADDR2&value=11"
# # {"data":"0x..."}
curljson "/$COIN/log?owner=$ADDR2"


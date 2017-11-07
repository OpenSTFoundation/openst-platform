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
    curl -s --user pepo:supersecret "$URL$1"
    echo
}

# sanity check
COIN="spc"
curljson "/$COIN/symbol"
curljson "/$COIN/name"
curljson "/$COIN/decimals"
BANK=`curljson /$COIN/reserve | egrep -oi '0x[0-9a-f]+'`
curljson "/$COIN/approve?sender=$BANK&spender=$ADDR&value=11"
# {"data":true}
curljson "/$COIN/transferFrom?sender=$ADDR&from=$BANK&to=$ADDR2&value=11"
# {"data":9999978}
curljson "/$COIN/cashout?sender=$ADDR2&value=11"
# {"data":"0x..."}
curljson "/$COIN/log?owner=$ADDR2"

COIN="pc"
curljson "/$COIN/symbol"
curljson "/$COIN/name"
curljson "/$COIN/decimals"
BANK=`curljson /$COIN/reserve | egrep -oi '0x[0-9a-f]+'`
# 0. cash-in
curljson "/$COIN/transfer?sender=$BANK&to=$ADDR&value=11"
# 1. up vote
curljson "/$COIN/transfer?sender=$ADDR&to=$ADDR2&value=1"
# 2. cash-out
curljson "/$COIN/cashout?sender=$ADDR2&value=1"
# 3. show transactions
curljson "/$COIN/log?owner=$ADDR2"

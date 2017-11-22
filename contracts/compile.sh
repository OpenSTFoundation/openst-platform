#!/bin/sh

BINDIRVALUE=./contracts/bin
ABIDIRUTILITY=./contracts/abi

mkdir -p "$BINDIRVALUE"
mkdir -p "$ABIDIRUTILITY"

echo ""
echo "Compiling SimpleToken.sol"
echo ""

solc --abi --overwrite ../SimpleTokenSale/contracts/SimpleToken.sol -o $ABIDIRUTILITY
solc --bin --overwrite ../SimpleTokenSale/contracts/SimpleToken.sol -o $BINDIRVALUE

echo ""
echo "Compiling Staking.sol"
echo ""

solc --abi --overwrite ../openst-protocol/contracts/Staking.sol -o $ABIDIRUTILITY
solc --bin --overwrite ../openst-protocol/contracts/Staking.sol -o $BINDIRVALUE

echo ""
echo "Compiling UtilityToken.sol"
echo ""

solc --abi --overwrite ../openst-protocol/contracts/UtilityToken.sol -o $ABIDIRUTILITY
solc --bin --overwrite ../openst-protocol/contracts/UtilityToken.sol -o $BINDIRVALUE
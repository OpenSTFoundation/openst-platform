#!/bin/sh

BINDIRVALUE=./contracts/bin
ABIDIRUTILITY=./contracts/abi

mkdir -p "$BINDIRVALUE"
mkdir -p "$ABIDIRUTILITY"

echo ""
echo "Compiling SimpleToken.sol"
echo ""

solc --abi --optimize --optimize-runs 200 --overwrite ../mosaic-contracts/contracts/SimpleToken/SimpleToken.sol -o $ABIDIRUTILITY
solc --bin --optimize --optimize-runs 200 --overwrite ../mosaic-contracts/contracts/SimpleToken/SimpleToken.sol -o $BINDIRVALUE

echo ""
echo "Compiling MockToken.sol"
echo ""

solc --abi --optimize --optimize-runs 200 --overwrite ../mosaic-contracts/contracts/SimpleToken/MockToken.sol -o $ABIDIRUTILITY
solc --bin --optimize --optimize-runs 200 --overwrite ../mosaic-contracts/contracts/SimpleToken/MockToken.sol -o $BINDIRVALUE


echo ""
echo "Compiling OpenSTUtility.sol"
echo ""

solc --abi --optimize --optimize-runs 200 --overwrite ../mosaic-contracts/contracts/OpenSTUtility.sol -o $ABIDIRUTILITY
solc --bin --optimize --optimize-runs 200 --overwrite ../mosaic-contracts/contracts/OpenSTUtility.sol -o $BINDIRVALUE

echo ""
echo "Compiling OpenSTValue.sol"
echo ""

solc --abi --optimize --optimize-runs 200 --overwrite ../mosaic-contracts/contracts/OpenSTValue.sol -o $ABIDIRUTILITY
solc --bin --optimize --optimize-runs 200 --overwrite ../mosaic-contracts/contracts/OpenSTValue.sol -o $BINDIRVALUE

echo ""
echo "Compiling Core.sol"
echo ""

solc --abi --optimize --optimize-runs 200 --overwrite ../mosaic-contracts/contracts/Core.sol -o $ABIDIRUTILITY
solc --bin --optimize --optimize-runs 200 --overwrite ../mosaic-contracts/contracts/Core.sol -o $BINDIRVALUE

echo ""
echo "Compiling Registrar.sol"
echo ""

solc --abi --optimize --optimize-runs 200 --overwrite ../mosaic-contracts/contracts/Registrar.sol -o $ABIDIRUTILITY
solc --bin --optimize --optimize-runs 200 --overwrite ../mosaic-contracts/contracts/Registrar.sol -o $BINDIRVALUE
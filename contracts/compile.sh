#!/bin/sh

BINDIRVALUE=./contracts/bin
ABIDIRUTILITY=./contracts/abi

mkdir -p "$BINDIRVALUE"
mkdir -p "$ABIDIRUTILITY"

echo ""
echo "Compiling SimpleToken.sol"
echo ""

solc --abi --optimize --optimize-runs 200 --overwrite ../openst-protocol/contracts/SimpleToken/SimpleToken.sol -o $ABIDIRUTILITY
solc --bin --optimize --optimize-runs 200 --overwrite ../openst-protocol/contracts/SimpleToken/SimpleToken.sol -o $BINDIRVALUE

echo ""
echo "Compiling OpenSTUtility.sol"
echo ""

solc --abi --optimize --optimize-runs 200 --overwrite ../openst-protocol/contracts/OpenSTUtility.sol -o $ABIDIRUTILITY
solc --bin --optimize --optimize-runs 200 --overwrite ../openst-protocol/contracts/OpenSTUtility.sol -o $BINDIRVALUE

echo ""
echo "Compiling OpenSTValue.sol"
echo ""

solc --abi --optimize --optimize-runs 200 --overwrite ../openst-protocol/contracts/OpenSTValue.sol -o $ABIDIRUTILITY
solc --bin --optimize --optimize-runs 200 --overwrite ../openst-protocol/contracts/OpenSTValue.sol -o $BINDIRVALUE

echo ""
echo "Compiling Core.sol"
echo ""

solc --abi --optimize --optimize-runs 200 --overwrite ../openst-protocol/contracts/Core.sol -o $ABIDIRUTILITY
solc --bin --optimize --optimize-runs 200 --overwrite ../openst-protocol/contracts/Core.sol -o $BINDIRVALUE

echo ""
echo "Compiling Registrar.sol"
echo ""

solc --abi --optimize --optimize-runs 200 --overwrite ../openst-protocol/contracts/Registrar.sol -o $ABIDIRUTILITY
solc --bin --optimize --optimize-runs 200 --overwrite ../openst-protocol/contracts/Registrar.sol -o $BINDIRVALUE
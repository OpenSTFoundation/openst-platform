#! /bin/sh

mkdir -p "./bin"
mkdir -p "./abi"

echo ""
echo "Compiling Staking.sol"
echo ""

solc --combined-json=abi,bin ../../openst-protocol/contracts/Staking.sol > ../contracts/Staking.json


echo ""
echo "Compiling UtilityToken.sol"
echo ""

solc --combined-json=abi,bin ../../openst-protocol/contracts/UtilityToken.sol > ../contracts/UtilityToken.json

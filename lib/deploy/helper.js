"use strict";

const  rootPrefix = '../..'
  , contractHelper = require(rootPrefix+'/lib/contract_interact/helper');

const deployHelper = {
  perform: async function(name, web3Provider, abi, byteCode, deployerAddr, deployerAddrPassphrase, constructorArgs) {
    const oneGW = '0x3B9ACA00'
      , fiveGW = '0x12A05F200'
      , gasPrice = fiveGW;

    const options = {
      from : deployerAddr,
      gas  : 4700000,
      data : "0x" + byteCode,
      gasPrice: gasPrice
    };

    if (constructorArgs) {
      options.arguments = constructorArgs
    }

    const contract = new web3Provider.eth.Contract(
      abi,
      null, // since addr is not known yet
      options
    );

    console.log("Unlocking address: " + deployerAddr);
    await web3Provider.eth.personal.unlockAccount(deployerAddr, deployerAddrPassphrase);

    console.log("Deploying contract " + name);
    const txObj = contract.deploy(options)
      , transactionReceipt = await contractHelper.safeSend(web3Provider, txObj, {});

    const contractAddress = transactionReceipt.contractAddress;

    const code = await web3Provider.eth.getCode(contractAddress);

    if (code.length <= 2) {
      return Promise.reject("Contract deployment failed. Empty code.");
    }

    // Print summary
    console.log("Address  : " + contractAddress);
    console.log("Gas used : " + transactionReceipt.gasUsed);

    return Promise.resolve({
      receipt  : transactionReceipt,
      contractAddress : contractAddress
    });
  }
};

module.exports = deployHelper;

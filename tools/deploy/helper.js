"use strict";

/*
 * Deploy contracts on value and utility chains
 *
 */

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix+'/config/core_constants')
  , fiveGW = coreConstants.OST_VALUE_GAS_PRICE
  , gasPrice = fiveGW
  , gasLimit = 9000000 // TODO: Right now this is the max for any contract to be deployed. We should get it dynamically for each contract.
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , logger = require(rootPrefix+'/helpers/custom_console_logger')
  , web3EventsFormatter = require(rootPrefix+'/lib/web3/events/formatter');

const _private = {

  // Private method to wait for Transaction to be included in block
  getReceipt: function (web3Provider, transactionHash) {
    return new Promise(function (onResolve, onReject) {

      var txSetInterval = null;

      var handleResponse = function (response) {
        if (response) {
          clearInterval(txSetInterval);
          onResolve(response);
        } else {
          console.log('Waiting for ' + transactionHash + ' to be included in block.');
        }
      };

      txSetInterval = setInterval(
        function () {
          web3Provider.eth.getTransactionReceipt(transactionHash).then(handleResponse);
        },
        5000
      );

    });
  }

};

const deployHelper = {
  perform: async function (contractName,
                           web3Provider,
                           contractAbi,
                           contractBin,
                           deployerName,
                           customOptions,
                           constructorArgs) {

    const deployerAddr = coreAddresses.getAddressForUser(deployerName)
      , deployerAddrPassphrase = coreAddresses.getPassphraseForUser(deployerName);

    var options = {
      from: deployerAddr,
      gas: gasLimit,
      data: "0x" + contractBin,
      gasPrice: gasPrice
    };

    Object.assign(options, customOptions)

    if (constructorArgs) {
      options.arguments = constructorArgs;
    }

    var contract = new web3Provider.eth.Contract(
      contractAbi,
      null, // since addr is not known yet
      options
    );

    // this is needed since the contract object
    contract.setProvider(web3Provider.currentProvider);

    const deploy = function () {
      return new Promise(function (onResolve, onReject) {
        contract.deploy(options).send()
          .on('transactionHash', onResolve)
          .on('error', onReject);
      });
    };

    console.log("Unlocking address: " + deployerAddr);
    console.log("Unlocking!!!");
    await web3Provider.eth.personal.unlockAccount(deployerAddr, deployerAddrPassphrase);

    console.log("Deploying contract " + contractName);
    const transactionReceipt = await deploy().then(
      function (transactionHash) {
        return _private.getReceipt(web3Provider, transactionHash);
      }
    );

    const contractAddress = transactionReceipt.contractAddress;

    const code = await web3Provider.eth.getCode(contractAddress);

    if (code.length <= 2) {
      return Promise.reject("Contract deployment failed. Invalid code length for contract: " + contractName);
    }

    // Print summary
    console.log("Contract Address: " + contractAddress);
    console.log("Gas used: " + transactionReceipt.gasUsed);

    return Promise.resolve({
      receipt: transactionReceipt,
      contractAddress: contractAddress
    });
  },

  assertEvent: async function(formattedTransactionReceipt, eventName){
    var formattedEvents = await web3EventsFormatter.perform(formattedTransactionReceipt);
    var eventData = formattedEvents[eventName];
    if ( eventData === undefined ||  eventData == '') {
      logger.error("Event: "+eventName+ " is not found");
      logger.info(" eventData ");
      logger.info(eventData);
      process.exit(0);
    } else {
      logger.win(" event: "+eventName+ " is present in Reciept.");
    };
  }


};

module.exports = deployHelper;

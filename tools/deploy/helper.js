"use strict";

/**
 * This is utility class for deploying contract<br><br>
 *
 * Ref: {@link module:tools/deploy/DeployHelper}
 *
 * @module tools/deploy/helper
 */

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , fiveGW = coreConstants.OST_VALUE_GAS_PRICE
  , gasPrice = fiveGW
  , gasLimit = coreConstants.OST_VALUE_GAS_LIMIT // this is taken by default if no value is passed from outside
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , web3EventsFormatter = require(rootPrefix + '/lib/web3/events/formatter');

const _private = {

  /**
   * Wait for Transaction to be included in block
   *
   * @param {Web3} web3Provider - It could be value chain or utility chain provider
   * @param {String} transactionHash - Hash for which receipt is required.
   *
   * @return {Promise<TransactionHash>}
   */
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

/**
 * Deploy Helper class to perform deploy
 *
 * @exports tools/deploy/DeployHelper
 */
const deployHelper = {

  /**
   * Method deploys contract
   *
   * @param {String} contractName - Contract Name to be deployed
   * @param {Web3} web3Provider - Web3 Provider object
   * @param {String} contractAbi - Contract Abi to be deployed
   * @param {String} contractBin - Contract Bin file to be deployed
   * @param {String} deployerName - Deployer name
   * @param {Object} [customOptions] - Custom options for value/utility chain
   * @param {Object} [constructorArgs] - Arguments to be passed while deploying contract
   *
   * @async
   * @method perform
   * @return {Promise<Object>}
   *
   */
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

    Object.assign(options, customOptions);

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

    var deployFailedReason = null;
    const transactionReceipt = await deploy().then(
      function (transactionHash) {
        return _private.getReceipt(web3Provider, transactionHash);
      }
    ).catch(reason => {
      deployFailedReason = reason;
      console.log( deployFailedReason );
      return null;
    });

    if ( deployFailedReason ) {
      return Promise.reject( deployFailedReason );
    }

    console.log("deploy transactionReceipt ::", transactionReceipt);

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

  assertEvent: async function (formattedTransactionReceipt, eventName) {
    var formattedEvents = await web3EventsFormatter.perform(formattedTransactionReceipt);
    var eventData = formattedEvents[eventName];
    if (eventData === undefined || eventData == '') {
      logger.error("Event: " + eventName + " is not found");
      logger.info(" eventData ");
      logger.info(eventData);
      process.exit(0);
    } else {
      logger.win(" event: " + eventName + " is present in Reciept.");
    }
    ;
  }


};

module.exports = deployHelper;

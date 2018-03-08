"use strict";

/**
 * This is helper class for deploying contract<br><br>
 *
 * @module tools/deploy/helper
 */

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , web3EventsFormatter = require(rootPrefix + '/lib/web3/events/formatter')
  , contractInteractHelper = require(rootPrefix + '/lib/contract_interact/helper')
;

const gasPrice = coreConstants.OST_VALUE_GAS_PRICE
  , gasLimit = coreConstants.OST_VALUE_GAS_LIMIT // this is taken by default if no value is passed from outside
;

/**
 * Constructor for Deploy helper class
 *
 * @constructor
 */
const DeployHelperKlass = function () {};

DeployHelperKlass.prototype = {
  /**
   * Deploy
   *
   * @param {string} contractName - Contract Name to be deployed
   * @param {web3} web3Provider - Web3 Provider object
   * @param {string} contractAbi - Contract Abi to be deployed
   * @param {binary} contractBin - Contract Bin file to be deployed
   * @param {string} deployerName - Deployer name
   * @param {object} customOptions - Custom options for value/utility chain
   * @param {array} constructorArgs - Arguments to be passed while deploying contract
   *
   * @return {promise}
   *
   */
  perform: async function (contractName, web3Provider, contractAbi, contractBin, deployerName, customOptions, constructorArgs) {
    const oThis = this
      , deployerAddr = coreAddresses.getAddressForUser(deployerName)
      , deployerAddrPassphrase = coreAddresses.getPassphraseForUser(deployerName);

    const txParams = {
      from: deployerAddr,
      gas: gasLimit,
      gasPrice: gasPrice
    };

    Object.assign(txParams, customOptions);

    const options = {
      data: (web3Provider.utils.isHexStrict(contractBin) ? "" : "0x") + contractBin
    };

    Object.assign(options, txParams);

    if (constructorArgs) {
      options.arguments = constructorArgs;
    }

    const contract = new web3Provider.eth.Contract(
      contractAbi,
      null, // since addr is not known yet
      options
    );

    // this is needed since the contract object
    contract.setProvider(web3Provider.currentProvider);

    const deploy = async function () {
      const encodeABI = contract.deploy(options).encodeABI();
      txParams.data = encodeABI;

      return new Promise(function (onResolve, onReject) {
        web3Provider.eth.sendTransaction(txParams)
          .on('transactionHash', function(transactionHash){
            onResolve(transactionHash)
          })
          .on('error', onReject);
      });
    };

    logger.info('* Unlocking address:', deployerAddr);
    await web3Provider.eth.personal.unlockAccount(deployerAddr, deployerAddrPassphrase);

    logger.info('* Deploying contract:', contractName);
    var deployFailedReason = null;

    const transactionReceipt = await deploy().then(function (transactionHash) {
        return contractInteractHelper.waitAndGetTransactionReceipt(web3Provider, transactionHash, {});
      })
      .then(function(response){
        if (!response.isSuccess()) {
          throw response.err.msg;
        } else {
          return Promise.resolve(response.data.rawTransactionReceipt);
        }
      })
      .catch(reason => {
        deployFailedReason = reason;
        logger.error(deployFailedReason);
        return Promise.resolve({});
      });

    if ( deployFailedReason ) {
      process.exit(1);
    }

    logger.info('* Deploy transactionReceipt ::', transactionReceipt);

    const contractAddress = transactionReceipt.contractAddress
      , code = await web3Provider.eth.getCode(contractAddress);

    if (code.length <= 2) {
      const err = 'Contract deployment failed. Invalid code length for contract: ' + contractName;
      logger.error(err);
      return Promise.reject(err);
    }

    // Print summary
    logger.info('Contract Address:', contractAddress);
    logger.info('Gas used:', transactionReceipt.gasUsed);

    return Promise.resolve({
      receipt: transactionReceipt,
      contractAddress: contractAddress
    });
  },

  /**
   * Assert event
   *
   * @param {object} formattedTransactionReceipt - formatted transaction receipt object
   * @param {string} eventName - event name
   *
   * @return {promise<result>}
   */
  assertEvent: async function (formattedTransactionReceipt, eventName) {
    const formattedEvents = await web3EventsFormatter.perform(formattedTransactionReceipt);

    const eventData = formattedEvents[eventName];
    if (eventData === undefined || eventData === '') {
      logger.error("Event: " + eventName + " is not found");
      logger.info(" eventData ");
      logger.info(eventData);
      process.exit(1);
    } else {
      logger.win(" event: " + eventName + " is present in Reciept.");
    }
  }

};

module.exports = new DeployHelperKlass();

"use strict";

/**
 * This is helper class for deploying contract<br><br>
 *
 * @module tools/deploy/helper
 */

const rootPrefix = '../..'
  , InstanceComposer = require(rootPrefix + '/instance_composer')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , web3EventsFormatter = require(rootPrefix + '/lib/web3/events/formatter')
;

require(rootPrefix + '/config/core_constants');
require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/lib/contract_interact/helper');

/**
 * Constructor for Deploy helper class
 *
 * @constructor
 */
const DeployHelperKlass = function (configStrategy, instanceComposer) {

  const oThis = this
    , coreConstants = instanceComposer.getCoreConstants()
  ;

  oThis.gasPrice = coreConstants.OST_VALUE_GAS_PRICE;
  oThis.gasLimit = coreConstants.OST_VALUE_GAS_LIMIT; // this is taken by default if no value is passed from outside

};

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
      , coreAddresses = oThis.ic().getCoreAddresses()
      , deployerAddr = coreAddresses.getAddressForUser(deployerName)
      , deployerAddrPassphrase = coreAddresses.getPassphraseForUser(deployerName);

    const txParams = {
      from: deployerAddr,
      gas: oThis.gasLimit,
      gasPrice: oThis.gasPrice
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
    //contract.setProvider(web3Provider.currentProvider);

    const deploy = function () {
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
        const contractInteractHelper  = oThis.ic().getContractInteractHelper();
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

InstanceComposer.register(DeployHelperKlass, "getDeployHelper", true);

module.exports = DeployHelperKlass;

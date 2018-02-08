"use strict";

/**
 * This is helper class for deploying contract<br><br>
 *
 * @module tools/deploy/helper
 */

const openSTNotification = require('@openstfoundation/openst-notification')
;

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , web3EventsFormatter = require(rootPrefix + '/lib/web3/events/formatter')
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

    const deploy = function () {
      return new Promise(function (onResolve, onReject) {
        contract.deploy(options).send()
          .on('transactionHash', function(transactionHash){

            openSTNotification.publish_event.perform(
              {
                topic: ['deploy.' + contractName],
                message: {
                  kind: 'transaction_initiated',
                  payload: {
                    contract_name: contractName,
                    contract_address: '',
                    method: 'deploy',
                    params: {args: constructorArgs, txParams: txParams},
                    transaction_hash: transactionHash,
                    chain_id: web3Provider.chainId,
                    chain_kind: web3Provider.chainKind,
                    uuid: '',
                    tag: ''
                  }
                }
              }
            );

            onResolve(transactionHash)
          })
          .on('error', onReject);
      });
    };

    logger.info('* Unlocking address:', deployerAddr);
    await web3Provider.eth.personal.unlockAccount(deployerAddr, deployerAddrPassphrase);

    logger.info('* Deploying contract:', contractName);
    var deployFailedReason = null;

    const transactionReceipt = await deploy().then(
      function (transactionHash) {
        return oThis._getReceipt(web3Provider, transactionHash);
      }
    ).catch(reason => {
      deployFailedReason = reason;
      logger.error(deployFailedReason);
      return null;
    });

    if ( deployFailedReason ) {
      return Promise.reject( deployFailedReason );
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
  },

  /**
   * Wait for Transaction to be included in block
   *
   * @param {web3} web3Provider - It could be value chain or utility chain provider
   * @param {string} transactionHash - Hash for which receipt is required.
   *
   * @ignore
   * @return {promise<string>}
   */
  _getReceipt: function (web3Provider, transactionHash) {
    return new Promise(function (onResolve, onReject) {

      var txSetInterval = null;

      const handleResponse = function (response) {
        if (response) {
          clearInterval(txSetInterval);

          openSTNotification.publish_event.perform(
            {
              topic: ['transaction_mined'],
              message: {
                kind: 'transaction_mined',
                payload: {
                  transaction_hash: transactionHash,
                  chain_id: web3Provider.chainId,
                  chain_kind: web3Provider.chainKind
                }
              }
            }
          );

          onResolve(response);
        } else {
          logger.info('Waiting for mining:', transactionHash);
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

module.exports = new DeployHelperKlass();

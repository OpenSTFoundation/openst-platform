'use strict';

/**
 * This is utility class having helper methods to be used in contract interact classes.<br><br>
 *
 * @module lib/contract_interact/helper
 */

const assert = require('assert');

const rootPrefix = '../..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  basicHelper = require(rootPrefix + '/helpers/basic_helper');

require(rootPrefix + '/lib/web3/events/decoder');

/**
 * Constructor for helper methods class - ContractInteractHelperKlass
 *
 * @constructor
 */
const ContractInteractHelperKlass = function(configStrategy, instanceComposer) {};

ContractInteractHelperKlass.prototype = {
  /**
   * Call methods (execute methods which DO NOT modify state of contracts)
   *
   * @param {web3} web3Provider - It could be value chain or utility chain provider
   * @param {string} currContractAddr - current contract address
   * @param {object} encodeABI - encoded method ABI data
   * @param {object} [options] - optional params
   * @param {object} [transactionOutputs] - optional transactionOutputs
   *
   * @return {promise}
   *
   */
  call: function(web3Provider, currContractAddr, encodeABI, options, transactionOutputs) {
    var params = {
      to: currContractAddr,
      data: encodeABI
    };
    if (options) {
      Object.assign(params, options);
    }
    return web3Provider.eth.call(params).then(function(response) {
      if (transactionOutputs) {
        return web3Provider.eth.abi.decodeParameters(transactionOutputs, response);
      } else {
        return response;
      }
    });
  },

  /**
   * Get outputs of a given transaction
   *
   * @param {object} transactionObject - transactionObject is returned from call method.
   *
   * @return {object}
   *
   */
  getTransactionOutputs: function(transactionObject) {
    return transactionObject._method.outputs;
  },

  /**
   * Send methods (execute methods which modify state of a contracts)
   *
   * @param {web3} web3Provider - It could be value chain or utility chain provider
   * @param {string} currContractAddr - current contract address
   * @param {object} encodeABI - encoded method ABI data
   * @param {object} [options] - optional params
   * @param {object} [transactionOutputs] - optional transactionOutputs
   *
   * @return {promise}
   *
   */
  send: function(web3Provider, currContractAddr, encodeABI, options, transactionOutputs) {
    var params = {
      to: currContractAddr,
      data: encodeABI
    };
    if (options) {
      Object.assign(params, options);
    }

    return web3Provider.eth.sendTransaction(params).then(function(response) {
      if (transactionOutputs) {
        return web3Provider.eth.abi.decodeParameters(transactionOutputs, response);
      } else {
        return response;
      }
    });
  },

  /**
   * Safe (waits for transaction receipt) send transaction by sender name
   *
   * @param {web3} web3Provider - It could be value chain or utility chain provider
   * @param {string} currContractAddr - current contract address
   * @param {string} senderName - name of transaction's sender
   * @param {object} encodeABI - encoded method ABI data
   * @param {object} [txOptions] - optional txOptions
   * @param {object} [addressToNameMap] - optional addressToNameMap
   *
   * @return {promise}
   *
   */
  safeSend: function(web3Provider, currContractAddr, encodeABI, senderName, txOptions, addressToNameMap) {
    var oThis = this;
    return oThis
      .sendTxAsync(web3Provider, currContractAddr, encodeABI, senderName, txOptions)
      .then(function(transactionHash) {
        return oThis
          .waitAndGetTransactionReceipt(web3Provider, transactionHash, addressToNameMap)
          .then(function(txReceipt) {
            return Promise.resolve(txReceipt);
          });
      });
  },

  /**
   * Safe (waits for transaction receipt) send transaction by sender address
   *
   * @param {web3} web3Provider - It could be value chain or utility chain provider
   * @param {string} currContractAddr - current contract address
   * @param {string} senderAddr - address of transaction's sender senderAddr
   * @param {string} senderPassphrase - passphrase of
   * @param {object} encodeABI - encoded method ABI data
   * @param {object} [txOptions] - optional txOptions
   * @param {object} [addressToNameMap] - optional addressToNameMap
   *
   * @return {promise}
   *
   */
  safeSendFromAddr: function(
    web3Provider,
    currContractAddr,
    encodeABI,
    senderAddr,
    senderPassphrase,
    txOptions,
    addressToNameMap
  ) {
    const oThis = this;

    return oThis
      .sendTxAsyncFromAddr(web3Provider, currContractAddr, encodeABI, senderAddr, senderPassphrase, txOptions)
      .then(function(transactionHash) {
        return oThis.waitAndGetTransactionReceipt(web3Provider, transactionHash, addressToNameMap);
      });
  },

  /**
   * Decode result and typecast it to an Address
   *
   * @param {web3} web3Provider - It could be value chain or utility chain provider
   * @param {string} result - current contract address
   *
   * @return {promise}
   *
   */
  toAddress: function(web3Provider, result) {
    return new Promise(function(onResolve, onReject) {
      onResolve(web3Provider.eth.abi.decodeParameter('address', result));
    });
  },

  /**
   * Decode result and typecast it to a String
   *
   * @param {web3} web3Provider - It could be value chain or utility chain provider
   * @param {string} result - current contract address
   *
   * @return {promise}
   *
   */
  toString: function(web3Provider, result) {
    return new Promise(function(onResolve, onReject) {
      onResolve(web3Provider.eth.abi.decodeParameter('bytes32', result));
    });
  },

  /**
   * Decode result and typecast it to a Number
   *
   * @param {web3} web3Provider - It could be value chain or utility chain provider
   * @param {string} result - current contract address
   *
   * @return {promise}
   *
   */
  toNumber: function(web3Provider, result) {
    return new Promise(function(onResolve, onReject) {
      onResolve(web3Provider.utils.hexToNumber(result));
    });
  },

  /**
   * @ignore
   */
  sendTxAsync: function(web3Provider, currContractAddr, encodeABI, senderName, txOptions) {
    var oThis = this,
      coreAddresses = oThis.ic().getCoreAddresses();
    const senderAddr = coreAddresses.getAddressForUser(senderName),
      senderPassphrase = coreAddresses.getPassphraseForUser(senderName);

    return oThis.sendTxAsyncFromAddr(
      web3Provider,
      currContractAddr,
      encodeABI,
      senderAddr,
      senderPassphrase,
      txOptions
    );
  },

  /**
   * @ignore
   */
  sendTxAsyncFromAddr: function(web3Provider, currContractAddr, encodeABI, senderAddr, senderPassphrase, txOptions) {
    const txParams = {
      from: senderAddr,
      to: currContractAddr,
      data: encodeABI
    };
    Object.assign(txParams, txOptions);

    logger.info('sendTxAsyncFromAddr :: Unlock Account', senderAddr);
    return web3Provider.eth.personal
      .unlockAccount(senderAddr, senderPassphrase)
      .then(function() {
        var isPromiseSettled = false;
        logger.info('sendTxAsyncFromAddr :: Unlocked', senderAddr);
        return new Promise(async function(onResolve, onReject) {
          try {
            web3Provider.eth
              .sendTransaction(txParams, function(error, result) {
                //THIS CALLBACK IS IMPORTANT -> on('error') Does not explain the reason.

                logger.debug('sendTransaction :: callback :: error', error);
                logger.debug('sendTransaction :: callback :: result', result);
                if (error) {
                  logger.info('sendTxAsyncFromAddr :: sendTransaction :: error :: \n\t', error);
                  !isPromiseSettled && onReject(error);
                }
              })
              .on('transactionHash', function(txHash) {
                logger.debug('sendTxAsyncFromAddr :: sendTransaction :: transactionHash :: txHash ', txHash);
                isPromiseSettled = true;
                onResolve(txHash);
              });
          } catch (ex) {
            logger.error('sendTxAsyncFromAddr :: sendTransaction :: Exception :: \n\t', ex);
            onReject(ex);
          }
        });
      })
      .catch(function(reason) {
        logger.info('sendTxAsyncFromAddr :: catch :: \n\t', reason, '\n\t', JSON.stringify(reason));
        return Promise.reject(reason);
      });
  },

  /**
   * Get transaction receipt
   *
   * @param {object} web3Provider - It could be value chain or utility chain provider
   * @param {string} transactionHash - transaction hash
   *
   * @return {promise<result>}
   *
   */
  getTransactionReceiptFromTrasactionHash: function(web3Provider, transactionHash) {
    return new Promise(function(onResolve, onReject) {
      // number of times it will attempt to fetch
      var maxAttempts = 50;

      // time interval
      const timeInterval = 15000;

      var getReceipt = async function() {
        if (maxAttempts > 0) {
          const receipt = await web3Provider.eth.getTransactionReceipt(transactionHash);

          if (receipt) {
            return onResolve(responseHelper.successWithData({ receipt: receipt }));
          } else {
            maxAttempts--;
            setTimeout(getReceipt, timeInterval);
          }
        } else {
          let errObj = responseHelper.error({
            internal_error_identifier: 'l_ci_h_getTransactionReceiptFromTrasactionHash',
            api_error_identifier: 'receipt_not_found',
            error_config: basicHelper.fetchErrorConfig()
          });
          return onResolve(errObj);
        }
      };

      getReceipt();
    });
  },

  /**
   * @ignore
   */
  waitAndGetTransactionReceipt: function(web3Provider, transactionHash, addressToNameMap) {
    const oThis = this,
      web3EventsDecoder = oThis.ic().getWeb3EventsDecoder();

    return new Promise(function(onResolve, onReject) {
      const tryReceipt = function() {
        setTimeout(function() {
          web3Provider.eth.getTransactionReceipt(transactionHash).then(handleResponse);
        }, 5000);
      };

      const handleResponse = function(response) {
        if (response) {
          const web3EventsDecoderResult = web3EventsDecoder.perform(response, addressToNameMap);
          onResolve(web3EventsDecoderResult);
        } else {
          logger.info('Waiting for ' + transactionHash + ' to be mined');
          tryReceipt();
        }
      };

      tryReceipt();
    });
  }
};

InstanceComposer.register(ContractInteractHelperKlass, 'getContractInteractHelper', true);

module.exports = ContractInteractHelperKlass;

"use strict";

/**
 * This is utility class having helper methods to be used in contract interact classes.<br><br>
 *
 * @module lib/contract_interact/helper
 */

const assert = require("assert")
;

const rootPrefix = '../..'
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , web3EventsDecoder = require(rootPrefix + '/lib/web3/events/decoder')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;


/**
 * Constructor for helper methods class - ContractInteractHelperKlass
 *
 * @constructor
 */
const ContractInteractHelperKlass = function () {
};

ContractInteractHelperKlass.prototype = {

  /**
   * Call methods (execute methods which DO NOT modify state of contracts)
   *
   * @param {web3} web3RpcProvider - It could be value chain or utility chain provider
   * @param {string} currContractAddr - current contract address
   * @param {object} encodeABI - encoded method ABI data
   * @param {object} [options] - optional params
   * @param {object} [transactionOutputs] - optional transactionOutputs
   *
   * @return {promise}
   *
   */
  call: function (web3RpcProvider, currContractAddr, encodeABI, options, transactionOutputs) {
    var params = {
      to: currContractAddr,
      data: encodeABI
    };
    if (options) {
      Object.assign(params, options)
    }
    return web3RpcProvider.eth.call(params)
      .then(function (response) {
        logger.info(response);
        if (transactionOutputs) {
          return web3RpcProvider.eth.abi.decodeParameters(transactionOutputs, response);
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
  getTransactionOutputs: function (transactionObject) {
    return transactionObject._method.outputs;
  },

  /**
   * Send methods (execute methods which modify state of a contracts)
   *
   * @param {web3} web3RpcProvider - It could be value chain or utility chain provider
   * @param {string} currContractAddr - current contract address
   * @param {object} encodeABI - encoded method ABI data
   * @param {object} [options] - optional params
   * @param {object} [transactionOutputs] - optional transactionOutputs
   *
   * @return {promise}
   *
   */
  send: function (web3RpcProvider, currContractAddr, encodeABI, options, transactionOutputs) {
    var params = {
      to: currContractAddr,
      data: encodeABI
    };
    if (options) {
      Object.assign(params, options)
    }

    return web3RpcProvider.eth.sendTransaction(params)
      .then(function (response) {
        if (transactionOutputs) {
          return web3RpcProvider.eth.abi.decodeParameters(transactionOutputs, response);
        } else {
          return response;
        }
      });

  },

  /**
   * Safe (waits for transaction receipt) send transaction by sender name
   *
   * @param {web3} web3RpcProvider - It could be value chain or utility chain provider
   * @param {string} currContractAddr - current contract address
   * @param {string} senderName - name of transaction's sender
   * @param {object} encodeABI - encoded method ABI data
   * @param {object} [txOptions] - optional txOptions
   * @param {object} [addressToNameMap] - optional addressToNameMap
   *
   * @return {promise}
   *
   */
  safeSend: function (web3RpcProvider, currContractAddr, encodeABI, senderName, txOptions, addressToNameMap) {
    var oThis = this;
    return oThis.sendTxAsync(web3RpcProvider, currContractAddr, encodeABI, senderName, txOptions)
      .then(function (transactionHash) {
          return oThis.getTxReceipt(web3RpcProvider, transactionHash, addressToNameMap)
            .then(function (txReceipt) {
              if (txReceipt.gasUsed == txOptions.gasPrice) {
                logger.error("safeSend used complete gas gasPrice : " + txOptions.gasPrice);
              }
              return Promise.resolve(txReceipt);
            });
        }
      );
  },

  /**
   * Safe (waits for transaction receipt) send transaction by sender address
   *
   * @param {web3} web3RpcProvider - It could be value chain or utility chain provider
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
  safeSendFromAddr: function (web3RpcProvider, currContractAddr, encodeABI, senderAddr, senderPassphrase, txOptions,
                              addressToNameMap) {
    var oThis = this;
    return oThis.sendTxAsyncFromAddr(web3RpcProvider, currContractAddr, encodeABI, senderAddr, senderPassphrase,
      txOptions).then(function (transactionHash) {
        return oThis.getTxReceipt(web3RpcProvider, transactionHash, addressToNameMap);
      }
    );
  },

  /**
   * Decode result and typecast it to an Address
   *
   * @param {web3} web3RpcProvider - It could be value chain or utility chain provider
   * @param {string} result - current contract address
   *
   * @return {promise}
   *
   */
  toAddress: function (web3RpcProvider, result) {
    return new Promise(function (onResolve, onReject) {
      onResolve(web3RpcProvider.eth.abi.decodeParameter('address', result));
    });
  },

  /**
   * Decode result and typecast it to a String
   *
   * @param {web3} web3RpcProvider - It could be value chain or utility chain provider
   * @param {string} result - current contract address
   *
   * @return {promise}
   *
   */
  toString: function (web3RpcProvider, result) {
    return new Promise(function (onResolve, onReject) {
      onResolve(web3RpcProvider.eth.abi.decodeParameter('bytes32', result));
    });
  },

  /**
   * Decode result and typecast it to a Number
   *
   * @param {web3} web3RpcProvider - It could be value chain or utility chain provider
   * @param {string} result - current contract address
   *
   * @return {promise}
   *
   */
  toNumber: function (web3RpcProvider, result) {
    return new Promise(function (onResolve, onReject) {
      onResolve(web3RpcProvider.utils.hexToNumber(result));
    });
  },

  /**
   * @ignore
   */
  sendTxAsync: function (web3RpcProvider, currContractAddr, encodeABI, senderName, txOptions) {
    var oThis = this;
    const senderAddr = coreAddresses.getAddressForUser(senderName)
      , senderPassphrase = coreAddresses.getPassphraseForUser(senderName)
    ;

    return oThis.sendTxAsyncFromAddr(web3RpcProvider, currContractAddr, encodeABI, senderAddr, senderPassphrase, txOptions);
  },

  /**
   * @ignore
   */
  sendTxAsyncFromAddr: function (web3RpcProvider, currContractAddr, encodeABI, senderAddr, senderPassphrase,
                                 txOptions) {
    const txParams = {
      from: senderAddr,
      to: currContractAddr,
      data: encodeABI
    };
    Object.assign(txParams, txOptions);

    logger.info("sendTxAsyncFromAddr :: Unlock Account", senderAddr);
    return web3RpcProvider.eth.personal.unlockAccount(senderAddr, senderPassphrase)
      .then(function () {
        var isPromiseSettled = false;
        logger.info("sendTxAsyncFromAddr :: Unlocked", senderAddr);
        return new Promise(async function (onResolve, onReject) {
          try {
            web3RpcProvider.eth.sendTransaction(txParams, function (error, result) {
              //THIS CALLBACK IS IMPORTANT -> on('error') Does not explain the reason.

              logger.info("sendTransaction :: callback :: error", error);
              logger.info("sendTransaction :: callback :: result", result);
              if (error) {
                logger.info("sendTxAsyncFromAddr :: sendTransaction :: error :: \n\t", error);
                !isPromiseSettled && onReject(error);
              }
            })
              .on('transactionHash', function (txHash) {
                logger.info("sendTxAsyncFromAddr :: sendTransaction :: transactionHash :: txHash ", txHash);
                isPromiseSettled = true;
                onResolve(txHash);
              });
          } catch (ex) {
            logger.info("sendTxAsyncFromAddr :: sendTransaction :: Exception :: \n\t", JSON.stringify(ex));
            onReject(ex);
          }
        });
      })
      .catch(function (reason) {

        logger.info("sendTxAsyncFromAddr :: catch :: \n\t", reason, "\n\t", JSON.stringify(reason));
        return Promise.reject(reason);
      });
  },

  /**
   * @ignore
   */
  getTxReceipt: function (web3RpcProvider, transactionHash, addressToNameMap) {
    return new Promise(function (onResolve, onReject) {

      var tryReceipt = function () {
        setTimeout(function () {
            web3RpcProvider.eth.getTransactionReceipt(transactionHash).then(handleResponse);
          },
          5000
        );
      };

      var handleResponse = function (response) {
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
  },

  /**
   * @ignore
   */
  decodeUint256: function (web3RpcProvider, result) {
    return new Promise(function (onResolve, onReject) {
      onResolve(web3RpcProvider.eth.abi.decodeParameter('uint256', result));
    });
  },

  /**
   * @ignore
   */
  assertAddress: function (address) {
    assert.ok(/^0x[0-9a-fA-F]{40}$/.test(address), `Invalid blockchain address: ${address}`);
  },

  /**
   * @ignore
   */
  isAddressValid: function (address) {
    if (typeof address !== "string") {
      return false;
    }
    return /^0x[0-9a-fA-F]{40}$/.test(address);
  }

};

module.exports = new ContractInteractHelperKlass();
"use strict";

/**
 * Deocde logs from a transaction receipt.
 *
 * @module lib/web3/events/decoder
 *
 */

const rootPrefix = '../../..'
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

/**
 * Constructor for web3 events decoder
 *
 * @constructor
 */
const web3EventsDecoder = function () {
};

web3EventsDecoder.prototype = {

  /**
   * performer
   *
   * @param {object} txReceipt - transaction receipt object
   * @param {object} addressToNameMap - Map of the address(key) to name of contract(value)
   *
   * @return {result}
   */
  perform: function (txReceipt, addressToNameMap) {
    const oThis = this;

    var decodedEvents = [];

    // txReceipt is mandatory, return error if not present
    if (!txReceipt) {
      return responseHelper.error('tx_receipt_not_found', 'Transaction receipt was not found.');
    }

    // if block not mined, return error
    if (!txReceipt.blockNumber) {
      return responseHelper.error('l_w_ld_1', 'Transaction not yet mined. Please try after some time.');
    }

    var toAddr = txReceipt.to
      , contractName = oThis.getContractNameFor(toAddr, addressToNameMap);


    // if the address is a known address
    if (contractName && txReceipt.logs.length > 0) {
      var abiDecoder = require('abi-decoder')
        , relevantLogs = [];

      for (var i = 0; i < txReceipt.logs.length; i++) {
        const currContractName = oThis.getContractNameFor(txReceipt.logs[i].address, addressToNameMap)
          , currContractABI = coreAddresses.getAbiForContract(currContractName);

        // if contract name is null, continue to next log element.
        if (!currContractName) {
          continue;
        }

        // ABI not found for a contract for which name was recognized, hence error
        if (!currContractABI) {
          return responseHelper.error('l_w_ld_2', 'ABI not found for contract ' + currContractName);
        }

        // push the log element to relevant log array
        relevantLogs.push(txReceipt.logs[i]);
        abiDecoder.addABI(currContractABI);
      }

      if (relevantLogs.length > 0) {
        decodedEvents = abiDecoder.decodeLogs(relevantLogs);
      }
    }

    return responseHelper.successWithData({
      rawTransactionReceipt: txReceipt,
      formattedTransactionReceipt: {
        transactionHash: txReceipt.transactionHash,
        blockHash: txReceipt.blockHash,
        blockNumber: txReceipt.blockNumber,
        eventsData: decodedEvents,
        toAddress: toAddr,
        contractAddress: txReceipt.contractAddress || ''
      }
    });
  },

  /**
   * Get contract name for an particular address
   *
   * @param {string} address - address of the contract from which the event is raised
   * @param {object} addressToNameMap - Address to name map
   *
   * @return {string} - returns the name of the contract from the address - returns
   * null for contracts which are not recognized
   */
  getContractNameFor: function (address, addressToNameMap) {
    const lcAddress = String(address).toLowerCase();
    if (!addressToNameMap || !( addressToNameMap[address] || addressToNameMap[lcAddress] )) {
      return coreAddresses.getContractNameFor(address);
    }
    return addressToNameMap[address] || addressToNameMap[lcAddress];
  }

};

module.exports = new web3EventsDecoder();
"use strict";

/**
 * Decode logs from a transaction receipt
 *
 * @module lib/web3/events/formatter
 *
 */

const rootPrefix = '../../..'
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , responseHelper = require(rootPrefix+'/lib/formatter/response')
  ;

const web3EventsDecoder = function () {};

/**
 * Ivent Decoder.
 *
 * @namespace web3EventsDecoder
 *
 */
web3EventsDecoder.prototype = {

  /**
   * performer
   *
   * @param {Object} txReceipt
   * @param {Hash} addressToNameMap - Map of the address(key) to name(value)
   *
   * @returns {result} object of {@link resulthelpwe\\er}
   *
   * @methodOf web3EventsDecoder
   *
   */
  perform: function(txReceipt, addressToNameMap) {
    console.log("------> addressToNameMap" , addressToNameMap);
    const oThis = this;

    var decodedEvents = [];

    // Transaction receipt not found
    if (!txReceipt) {
      return responseHelper.error('tx_receipt_not_found', 'Transaction receipt was not found.');
    }

    // Block not yet mined
    if (!txReceipt.blockNumber) {
      return responseHelper.error('l_w_ld_1', 'Transaction not yet mined. Please try after some time.');
    }

    var toAddr = txReceipt.to;
    var contractName = oThis.getContractNameFor(toAddr, addressToNameMap);
    

    // if the address is a known address
    if (contractName && txReceipt.logs.length > 0) {

      var abiDecoder = require('abi-decoder')
        , relevantLogs = [];

      for (var i = 0; i < txReceipt.logs.length; i++) {

        var currContract = oThis.getContractNameFor(txReceipt.logs[i].address, addressToNameMap);

        console.debug('**** contract address: ' + txReceipt.logs[i].address + ' at log index(' + i + ') in TxHash: ' + txReceipt.transactionHash + '');

        if (!currContract) {
          console.error('**** No contract found for contract address: ' + txReceipt.logs[i].address + ' at log index(' + i + ') in TxHash: ' + txReceipt.transactionHash + '');
          continue;
        }

        const currContractABI = coreAddresses.getAbiForContract(currContract);

        // ABI not found
        if (!currContractABI) {
          return responseHelper.error('l_w_ld_2', 'ABI not found for contract '+ currContract);
        }

        relevantLogs.push(txReceipt.logs[i]);
        abiDecoder.addABI(currContractABI);
      }

      if(relevantLogs.length > 0) {
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
  }
  , getContractNameFor: function ( address, addressToNameMap ) {
    const lcAddress = String( address ).toLowerCase();
    if ( !addressToNameMap || !( addressToNameMap[ address ] || addressToNameMap[ lcAddress ] ) ) {
      return coreAddresses.getContractNameFor( address );
    }
    return addressToNameMap[ address ] || addressToNameMap[ lcAddress ];
  }

};

module.exports = new web3EventsDecoder();
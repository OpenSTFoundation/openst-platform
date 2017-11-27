"use strict";

const rootPrefix = '../..'
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , responseHelper = require(rootPrefix+'/lib/formatter/response');

const web3LogsDecoder = {
  // decode logs from a transaction receipt
  perform: function(txReceipt) {
    var decodedEvents = [];

    // Transaction receipt not found
    if (!txReceipt) {
      return responseHelper.error('tx_receipt_not_found', 'Transaction receipt was not found.');
    }

    // Block not yet mined
    if (!txReceipt.blockNumber) {
      return responseHelper.error('l_w_ld_1', 'Transaction not yet mined. Please try after some time.');
    }

    const toAddr = txReceipt.to
      , contractName = coreAddresses.getContractNameFor(toAddr);

    // if the address is a known address
    if (contractName && txReceipt.logs.length > 0) {

      var abiDecoder = require('abi-decoder')
        , relevantLogs = [];

      for (var i = 0; i < txReceipt.logs.length; i++) {

        var currContract = coreAddresses.getContractNameFor(txReceipt.logs[i].address);

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
};

module.exports = web3LogsDecoder;
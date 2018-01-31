"use strict";

/**
 * Get Transaction Receipt
 */

const rootPrefix = '../..'
  , web3ProviderFactory = require(rootPrefix + '/lib/web3/providers/factory')
  , contractInteractHelper = require(rootPrefix + '/lib/contract_interact/helper')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  ;


const getTransactionReceipt = async function (transactionHash, chain) {
  try {

    const web3Provider = web3ProviderFactory.getProvider(chain, web3ProviderFactory.typeRPC);
    if(!web3Provider) {
      // this is a error scenario.
      return Promise.reject('Invalid chain.');
    }

    const trxReceipt = await contractInteractHelper.getTxReceipt(web3Provider, transactionHash);

    if(!trxReceipt || !trxReceipt.isSuccess()) {
      // this is a error scenario.
      return Promise.reject('Transaction not mined yet.');
    }

    return Promise.resolve(responseHelper.successWithData(trxReceipt.data));


  } catch (err) {
    return Promise.reject('Something went wrong. ' + err.message)
  }
};

module.exports = getTransactionReceipt;
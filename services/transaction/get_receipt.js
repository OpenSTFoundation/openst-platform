"use strict";

/**
 * Get Transaction receipt
 *
 * @module services/transaction/get_receipt
 */

const rootPrefix = '../..'
  , web3ProviderFactory = require(rootPrefix + '/lib/web3/providers/factory')
  , web3EventsDecoder = require(rootPrefix + '/lib/web3/events/decoder')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;

/**
 * Get Transaction Receipt Service
 *
 * @param {object} params -
 * @param {string} params.chain - Chain on which transaction was executed
 * @param {string} params.transaction_hash - Transaction hash for lookup
 * @param {object} params.address_to_name_map - hash of contract address to contract name
 *
 * @constructor
 */
const GetReceiptKlass = function(params) {
  const oThis = this
  ;

  params = params || {};
  oThis.transactionHash = params.transaction_hash;
  oThis.chain = params.chain;
  oThis.addressToNameMap = params.address_to_name_map || {};
};

GetReceiptKlass.prototype = {
  /**
   * Perform<br><br>
   *
   * @return {promise<result>} - returns a promise which resolves to an object of kind Result
   */
  perform: async function () {
    const oThis = this
    ;

    try {

      // validations
      if (!basicHelper.isTxHashValid(oThis.transactionHash)) {
        return Promise.resolve(responseHelper.error('s_t_gr_1', 'Invalid transaction hash'));
      }

      const web3Provider = web3ProviderFactory.getProvider(oThis.chain, web3ProviderFactory.typeWS);
      if(!web3Provider) {
        return Promise.resolve(responseHelper.error('s_t_gr_2', 'Invalid chain.'));
      }

      const txReceipt = await web3Provider.eth.getTransactionReceipt( oThis.transactionHash);

      if (!txReceipt) {
        return Promise.resolve(responseHelper.successWithData({}));
      } else {
        const web3EventsDecoderResponse = web3EventsDecoder.perform(txReceipt, oThis.addressToNameMap);
        return Promise.resolve(web3EventsDecoderResponse);
      }

    } catch (err) {
      return Promise.resolve(responseHelper.error('s_t_gr_4', 'Something went wrong. ' + err.message));
    }
  }
};

module.exports = GetReceiptKlass;
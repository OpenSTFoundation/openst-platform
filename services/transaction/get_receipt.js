"use strict";

/**
 * Get Transaction receipt
 *
 * @module services/transaction/get_receipt
 */

const rootPrefix = '../..'
  , openSTNotification = require('@openstfoundation/openst-notification')
  , web3ProviderFactory = require(rootPrefix + '/lib/web3/providers/factory')
  , web3EventsDecoder = require(rootPrefix + '/lib/web3/events/decoder')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

/**
 * Get Transaction Receipt Service
 *
 * @param {object} params - this is object with keys - transaction_hash, chain
 *
 * @constructor
 */
const GetReceiptKlass = function(params) {
  const oThis = this
  ;

  oThis.transactionHash = params.transaction_hash;
  oThis.chain = params.chain;
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

      const web3Provider = web3ProviderFactory.getProvider(oThis.chain, web3ProviderFactory.typeRPC);
      if(!web3Provider) {
        return Promise.resolve(responseHelper.error('s_t_gr_1', 'Invalid chain.'));
      }

      const txReceipt = await web3Provider.eth.getTransactionReceipt( oThis.transactionHash);

      if(!txReceipt){
        return Promise.resolve(responseHelper.error('s_t_gr_2', 'Transaction yet not mined.'));
      } else {
        const web3EventsDecoderResponse = web3EventsDecoder.perform(txReceipt, {});
        openSTNotification.publish_event.perform(
          {
            topic: ['transaction_mined'],
            message: {
              kind: 'transaction_mined',
              payload: {
                transaction_hash: oThis.transactionHash,
                chain_id: web3Provider.chainId,
                chain_kind: web3Provider.chainKind
              }
            }
          }
        );
        return Promise.resolve(web3EventsDecoderResponse);
      }

    } catch (err) {
      return Promise.resolve(responseHelper.error('s_t_gr_3', 'Something went wrong. ' + err.message));
    }
  }
};

module.exports = GetReceiptKlass;
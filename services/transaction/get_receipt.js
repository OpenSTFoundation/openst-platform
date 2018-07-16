"use strict";

/**
 * Get Transaction receipt
 *
 * @module services/transaction/get_receipt
 */

 //getWeb3ProviderFactory

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , InstanceComposer = require( rootPrefix + "/instance_composer")
;

require(rootPrefix + '/lib/web3/providers/factory');
require(rootPrefix + '/lib/web3/events/decoder');

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
const GetReceiptKlass = function (params) {
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
      , web3EventsDecoder = oThis.ic().getWeb3EventsDecoder()
    ;

    try {

      // validations
      if (!basicHelper.isTxHashValid(oThis.transactionHash)) {
        let errObj = responseHelper.error({
          internal_error_identifier: 's_t_gr_1',
          api_error_identifier: 'invalid_transaction_hash',
          error_config: basicHelper.fetchErrorConfig()
        });
        return Promise.resolve(errObj);
      }
      
      let web3ProviderFactory = oThis.ic().getWeb3ProviderFactory();
      const web3Provider = web3ProviderFactory.getProvider(oThis.chain, web3ProviderFactory.typeWS);
      if (!web3Provider) {
        let errObj = responseHelper.error({
          internal_error_identifier: 's_t_gr_2',
          api_error_identifier: 'invalid_chain',
          error_config: basicHelper.fetchErrorConfig()
        });
        return Promise.resolve(errObj);
      }

      const txReceipt = await web3Provider.eth.getTransactionReceipt(oThis.transactionHash);

      if (!txReceipt) {
        return Promise.resolve(responseHelper.successWithData({}));
      } else {
        const web3EventsDecoderResponse = web3EventsDecoder.perform(txReceipt, oThis.addressToNameMap);
        return Promise.resolve(web3EventsDecoderResponse);
      }

    } catch (err) {
      console.error('err', err);
      let errObj = responseHelper.error({
        internal_error_identifier: 's_t_gr_4',
        api_error_identifier: 'something_went_wrong',
        error_config: basicHelper.fetchErrorConfig()
      });
      return Promise.resolve(errObj);
    }
  }
};

InstanceComposer.registerShadowableClass(GetReceiptKlass, "getTransactionReceiptService");

module.exports = GetReceiptKlass;
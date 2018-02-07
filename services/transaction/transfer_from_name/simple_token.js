"use strict";

/**
 * Transfer Simple Token by name
 *
 * @module services/transaction/transfer_from_name/simple_token
 */

const rootPrefix = '../../..'
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , fundManager = require(rootPrefix + '/lib/fund_manager')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

/**
 * Transfer Simple Token Service
 *
 * @param {object} params - this is object with keys - sender_name, recipient_address, amount_in_wei
 *
 * @constructor
 */
const TransferSimpleTokenByNameKlass = function(params) {
  const oThis = this
  ;

  oThis.senderName = params.sender_name;
  oThis.recipientAddress = params.recipient_address;
  oThis.amountInWei = params.amount_in_wei;
};

TransferSimpleTokenByNameKlass.prototype = {
  /**
   * Perform<br><br>
   *
   * @return {promise<result>} - returns a promise which resolves to an object of kind Result
   */
  perform: function () {
    const oThis = this
    ;

    try {

      const senderAddress = coreAddresses.getAddressForUser(oThis.senderName)
        , senderPassphrase = coreAddresses.getPassphraseForUser(oThis.senderName)
      ;

      if(!senderAddress || !senderPassphrase){
        return Promise.resolve(responseHelper.error('s_t_tfn_st_1', 'Unrecognized sender name'));
      }

      return fundManager.transferST(senderAddress, senderPassphrase, oThis.recipientAddress, oThis.amountInWei);

    } catch (err) {
      return Promise.resolve(responseHelper.error('s_t_tfn_st_2', 'Something went wrong. ' + err.message));
    }
  }
};

module.exports = TransferSimpleTokenByNameKlass;
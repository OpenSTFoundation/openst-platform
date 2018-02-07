"use strict";

/**
 * Transfer Simple Token
 *
 * @module services/transaction/transfer/simple_token
 */

const rootPrefix = '../../..'
  , fundManager = require(rootPrefix + '/lib/fund_manager')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

/**
 * Transfer Simple Token Service
 *
 * @param {object} params - this is object with keys - sender_address, sender_passphrase, recipient_address, amount_in_wei
 *
 * @constructor
 */
const TransferSimpleTokenKlass = function(params) {
  const oThis = this
  ;

  oThis.senderAddress = params.sender_address;
  oThis.senderPassphrase = params.sender_passphrase;
  oThis.recipientAddress = params.recipient_address;
  oThis.amountInWei = params.amount_in_wei;
};

TransferSimpleTokenKlass.prototype = {
  /**
   * Perform<br><br>
   *
   * @return {promise<result>} - returns a promise which resolves to an object of kind Result
   */
  perform: function () {
    const oThis = this
    ;

    try {
      return fundManager.transferST(oThis.senderAddress, oThis.senderPassphrase, oThis.recipientAddress, oThis.amountInWei);
    } catch (err) {
      return Promise.resolve(responseHelper.error('s_t_t_st_1', 'Something went wrong. ' + err.message));
    }
  }
};

module.exports = TransferSimpleTokenKlass;
"use strict";

/**
 * Transfer Eth
 *
 * @module services/transaction/transfer/eth
 */

const rootPrefix = '../../..'
  , fundManager = require(rootPrefix + '/lib/fund_manager')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

/**
 * Transfer Eth Service
 *
 * @param {object} params - this is object with keys - sender_address, sender_passphrase, recipient_address, amount_in_wei
 *
 * @constructor
 */
const TransferEthKlass = function(params) {
  const oThis = this
  ;

  oThis.senderAddress = params.sender_address;
  oThis.senderPassphrase = params.sender_passphrase;
  oThis.recipientAddress = params.recipient_address;
  oThis.amountInWei = params.amount_in_wei;
};

TransferEthKlass.prototype = {
  /**
   * Perform<br><br>
   *
   * @return {promise<result>} - returns a promise which resolves to an object of kind Result
   */
  perform: function () {
    const oThis = this
    ;

    try {
      return fundManager.transferEth(oThis.senderAddress, oThis.senderPassphrase, oThis.recipientAddress, oThis.amountInWei);
    } catch (err) {
      return Promise.resolve(responseHelper.error('s_t_t_e_1', 'Something went wrong. ' + err.message));
    }
  }
};

module.exports = TransferEthKlass;
"use strict";

/**
 * Transfer Branded Token
 *
 * @module services/transaction/transfer_branded_token
 */

const rootPrefix = '../..'
  , fundManager = require(rootPrefix + '/lib/fund_manager')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

/**
 * Transfer Branded Token Service
 *
 * @param {object} params - this is object with keys - erc20_address, reserve_address, reserve_passphrase,
 *                                                sender_address, sender_passphrase, recipient_address, amount_in_wei
 *
 * @constructor
 */
const TransferBrandedTokenKlass = function(params) {
  const oThis = this
  ;

  oThis.erc20Address = params.erc20_address;
  oThis.reserveAddress = params.reserve_address;
  oThis.reservePassphrase = params.reserve_passphrase;
  oThis.senderAddress = params.sender_address;
  oThis.senderPassphrase = params.sender_passphrase;
  oThis.recipientAddress = params.recipient_address;
  oThis.amountInWei = params.amount_in_wei;
};

TransferBrandedTokenKlass.prototype = {
  /**
   * Perform<br><br>
   *
   * @return {promise<result>} - returns a promise which resolves to an object of kind Result
   */
  perform: function () {
    const oThis = this
    ;

    try {
      return fundManager.transferBrandedToken(oThis.erc20Address, oThis.reserveAddress, oThis.reservePassphrase,
        oThis.senderAddress, oThis.senderPassphrase, oThis.recipientAddress, oThis.amountInWei)
    } catch (err) {
      return Promise.resolve(responseHelper.error('s_t_tbt_1', 'Something went wrong. ' + err.message));
    }
  }
};

module.exports = TransferBrandedTokenKlass;
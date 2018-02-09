"use strict";

/**
 * Transfer Simple Token
 *
 * @module services/transaction/transfer/simple_token
 */

const rootPrefix = '../../..'
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , fundManager = require(rootPrefix + '/lib/fund_manager')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

/**
 * Transfer Simple Token Service
 *
 * @param {object} params - this is object with keys - [either one of {sender_address, sender_passphrase} and {sender_name}],
 *                                                      [either one of {recipient_address} and {recipient_name}], amount_in_wei
 *
 * @constructor
 */
const TransferSimpleTokenKlass = function(params) {
  const oThis = this
  ;

  oThis.senderAddress = params.sender_address;
  oThis.senderPassphrase = params.sender_passphrase;
  oThis.senderName = params.sender_name;
  oThis.recipientAddress = params.recipient_address;
  oThis.recipientName = params.recipient_name;
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
      if(!oThis.senderAddress) {
        oThis.senderAddress = coreAddresses.getAddressForUser(oThis.senderName);
        oThis.senderPassphrase = coreAddresses.getPassphraseForUser(oThis.senderName);
      }

      if(!oThis.recipientAddress) {
        oThis.recipientAddress = coreAddresses.getAddressForUser(oThis.recipientName);
      }

      if ((!oThis.senderAddress) || (!oThis.senderPassphrase) || (!oThis.recipientAddress)) {
        return Promise.resolve(responseHelper.error('s_t_t_st_1',
          'Invalid params - sender_address or sender_passphrase or recipient_address'));
      }

      return fundManager.transferST(oThis.senderAddress, oThis.senderPassphrase, oThis.recipientAddress, oThis.amountInWei);
    } catch (err) {
      return Promise.resolve(responseHelper.error('s_t_t_st_2', 'Something went wrong. ' + err.message));
    }
  }
};

module.exports = TransferSimpleTokenKlass;
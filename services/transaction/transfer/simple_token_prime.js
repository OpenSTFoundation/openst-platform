"use strict";

/**
 * Transfer Simple Token Prime
 *
 * @module services/transaction/transfer/simple_token_prime
 */

const rootPrefix = '../../..'
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;

const stPrimeContractAddress = coreAddresses.getAddressForContract('stPrime')
  , StPrimeKlass = require(rootPrefix + '/lib/contract_interact/st_prime')
  , stPrime = new StPrimeKlass(stPrimeContractAddress)
;

/**
 * Transfer Simple Token Prime Service
 *
 * @param {object} params -
 * @param {string} params.sender_address - Sender address
 * @param {string} params.sender_passphrase - Sender passphrase
 * @param {string} [params.sender_name] - Sender name where only platform has address and passphrase
 * @param {string} params.recipient_address - Recipient address
 * @param {string} [params.recipient_name] - Recipient name name where only platform has address and passphrase
 * @param {number} params.amount_in_wei - Amount (in wei) to transfer
 *
 * @constructor
 */
const TransferSimpleTokenPrimeKlass = function(params) {
  const oThis = this
  ;

  params = params || {};
  oThis.senderAddress = params.sender_address;
  oThis.senderPassphrase = params.sender_passphrase;
  oThis.senderName = params.sender_name;
  oThis.recipientAddress = params.recipient_address;
  oThis.recipientName = params.recipient_name;
  oThis.amountInWei = params.amount_in_wei;
  oThis.tag = 'GasRefill';
  oThis.inAsync = true;
};

TransferSimpleTokenPrimeKlass.prototype = {
  /**
   * Perform<br><br>
   *
   * @return {promise<result>} - returns a promise which resolves to an object of kind Result
   */
  perform: function () {
    const oThis = this
    ;

    try {
      // Get sender details by name
      if(oThis.senderName) {
        oThis.senderAddress = coreAddresses.getAddressForUser(oThis.senderName);
        oThis.senderPassphrase = coreAddresses.getPassphraseForUser(oThis.senderName);
      }
      // Get recipient details by name
      if(oThis.recipientName) {
        oThis.recipientAddress = coreAddresses.getAddressForUser(oThis.recipientName);
      }

      // Validations
      if (!basicHelper.isAddressValid(oThis.senderAddress) || !oThis.senderPassphrase) {
        return Promise.resolve(responseHelper.error('s_t_t_stp_1', 'Invalid sender details'));
      }
      if (!basicHelper.isAddressValid(oThis.recipientAddress)) {
        return Promise.resolve(responseHelper.error('s_t_t_stp_2', 'Invalid recipient details'));
      }
      if (!basicHelper.isNonZeroWeiValid(oThis.amountInWei)) {
        return Promise.resolve(responseHelper.error('s_t_t_stp_3', 'Invalid amount'));
      }

      // Format wei
      oThis.amountInWei = basicHelper.formatWeiToString(oThis.amountInWei);

      return stPrime.transfer(oThis.senderAddress, oThis.senderPassphrase, oThis.recipientAddress, oThis.amountInWei,
        {tag: oThis.tag, inAsync: oThis.inAsync});
    } catch (err) {
      return Promise.resolve(responseHelper.error('s_t_t_stp_4', 'Something went wrong. ' + err.message));
    }
  }
};

module.exports = TransferSimpleTokenPrimeKlass;
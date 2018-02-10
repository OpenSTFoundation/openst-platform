"use strict";

/**
 * Transfer Branded Token
 *
 * @module services/transaction/transfer/branded_token
 */

const rootPrefix = '../../..'
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , fundManager = require(rootPrefix + '/lib/fund_manager')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;

/**
 * Transfer Branded Token Service
 * TODO: Gas management should now be done by the caller. But Reserve are still asked to avoid changes, if we uncomment the gas management code
 *
 * @param {object} params -
 * @param {string} params.erc20_address - Branded token EIP20 address
 * @param {string} params.sender_address - Sender address
 * @param {string} params.sender_passphrase - Sender passphrase
 * @param {string} [params.sender_name] - Sender name where only platform has address and passphrase
 * @param {string} params.recipient_address - Recipient address
 * @param {string} [params.recipient_name] - Recipient name name where only platform has address and passphrase
 * @param {number} params.amount_in_wei - Amount (in wei) to transfer
 *
 * @param {string} params.reserve_address - Reserve address to give ST' (gas) to sender, if required
 * @param {string} params.reserve_passphrase - Reserve passphrase
 *
 * @constructor
 */
const TransferBrandedTokenKlass = function(params) {
  const oThis = this
  ;

  params = params || {};
  oThis.erc20Address = params.erc20_address;
  oThis.reserveAddress = params.reserve_address;
  oThis.reservePassphrase = params.reserve_passphrase;
  oThis.senderAddress = params.sender_address;
  oThis.senderPassphrase = params.sender_passphrase;
  oThis.senderName = params.sender_name;
  oThis.recipientAddress = params.recipient_address;
  oThis.recipientName = params.recipient_name;
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
      if (!basicHelper.isAddressValid(oThis.erc20Address)) {
        return Promise.resolve(responseHelper.error('s_t_t_bt_1', 'Invalid ERC20 address'));
      }
      if (!basicHelper.isAddressValid(oThis.senderAddress) || !oThis.senderPassphrase) {
        return Promise.resolve(responseHelper.error('s_t_t_bt_2', 'Invalid sender details'));
      }
      if (!basicHelper.isAddressValid(oThis.recipientAddress)) {
        return Promise.resolve(responseHelper.error('s_t_t_bt_3', 'Invalid recipient details'));
      }
      if (!basicHelper.isNonZeroWeiValid(oThis.amountInWei)) {
        return Promise.resolve(responseHelper.error('s_t_t_bt_4', 'Invalid amount'));
      }
      if (!basicHelper.isAddressValid(oThis.reserveAddress) || !oThis.reservePassphrase) {
        return Promise.resolve(responseHelper.error('s_t_t_bt_6', 'Invalid reserve details'));
      }

      // Format wei
      oThis.amountInWei = basicHelper.formatWeiToString(oThis.amountInWei);

      return fundManager.transferBrandedToken(oThis.erc20Address, oThis.reserveAddress, oThis.reservePassphrase,
        oThis.senderAddress, oThis.senderPassphrase, oThis.recipientAddress, oThis.amountInWei);
    } catch (err) {
      return Promise.resolve(responseHelper.error('s_t_t_bt_5', 'Something went wrong. ' + err.message));
    }
  }
};

module.exports = TransferBrandedTokenKlass;
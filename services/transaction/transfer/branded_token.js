"use strict";

/**
 * Transfer Branded Token
 *
 * @module services/transaction/transfer/branded_token
 */

const rootPrefix = '../../..'
  , InstanceComposer = require(rootPrefix + '/instance_composer')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;

require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/lib/contract_interact/branded_token');

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
 * @param {object} params.options -
 * @param {string} params.options.tag - extra param which gets logged for transaction as transaction type
 * @param {boolean} [params.options.returnType] - Desired return type. possible values: uuid, txHash, txReceipt. Default: txHash
 *
 * @constructor
 */
const TransferBrandedTokenKlass = function (params) {
  const oThis = this
  ;
  
  params = params || {};
  oThis.erc20Address = params.erc20_address;
  oThis.senderAddress = params.sender_address;
  oThis.senderPassphrase = params.sender_passphrase;
  oThis.senderName = params.sender_name;
  oThis.recipientAddress = params.recipient_address;
  oThis.recipientName = params.recipient_name;
  oThis.amountInWei = params.amount_in_wei;
  oThis.tag = (params.options || {}).tag;
  oThis.returnType = (params.options || {}).returnType || 'txHash';
};

TransferBrandedTokenKlass.prototype = {
  /**
   * Perform
   *
   * @return {Promise}
   */
  perform: function () {
    
    const oThis = this
    ;
    
    return oThis.asyncPerform()
      .catch(function (error) {
        if (responseHelper.isCustomResult(error)) {
          return error;
        } else {
          logger.error('openst-platform::services/transaction/transfer/branded_token.js::perform::catch');
          logger.error(error);
          return responseHelper.error({
            internal_error_identifier: 's_t_t_bt_6',
            api_error_identifier: 'something_went_wrong',
            debug_options: {}
          });
        }
      });
  },
  
  /**
   * asyncPerform
   *
   * @return {promise<result>} - returns a promise which resolves to an object of kind Result
   */
  asyncPerform: async function () {
    const oThis = this
      , coreAddresses = oThis.ic().getCoreAddresses()
      , BrandedTokenKlass = oThis.ic().getBrandedTokenInteractClass()
    ;
    
    // Get sender details by name
    if (oThis.senderName) {
      oThis.senderAddress = coreAddresses.getAddressForUser(oThis.senderName);
      oThis.senderPassphrase = coreAddresses.getPassphraseForUser(oThis.senderName);
    }
    
    // Get recipient details by name
    if (oThis.recipientName) {
      oThis.recipientAddress = coreAddresses.getAddressForUser(oThis.recipientName);
    }
    
    // Validations
    if (!basicHelper.isAddressValid(oThis.erc20Address)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 's_t_t_bt_1',
        api_error_identifier: 'invalid_address',
        error_config: basicHelper.fetchErrorConfig()
      });
      return Promise.resolve(errObj);
    }
    if (!basicHelper.isAddressValid(oThis.senderAddress) || !oThis.senderPassphrase) {
      let errObj = responseHelper.error({
        internal_error_identifier: 's_t_t_bt_2',
        api_error_identifier: 'invalid_address',
        error_config: basicHelper.fetchErrorConfig()
      });
      return Promise.resolve(errObj);
    }
    if (!basicHelper.isAddressValid(oThis.recipientAddress)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 's_t_t_bt_3',
        api_error_identifier: 'invalid_address',
        error_config: basicHelper.fetchErrorConfig()
      });
      return Promise.resolve(errObj);
    }
    if (!basicHelper.isNonZeroWeiValid(oThis.amountInWei)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 's_t_t_bt_4',
        api_error_identifier: 'invalid_amount',
        error_config: basicHelper.fetchErrorConfig()
      });
      return Promise.resolve(errObj);
    }
    if (!basicHelper.isTagValid(oThis.tag)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 's_t_t_bt_5',
        api_error_identifier: 'invalid_transaction_tag',
        error_config: basicHelper.fetchErrorConfig()
      });
      return Promise.resolve(errObj);
    }
    
    // Format wei
    oThis.amountInWei = basicHelper.formatWeiToString(oThis.amountInWei);
    
    var brandedToken = new BrandedTokenKlass({ERC20: oThis.erc20Address});
    
    return brandedToken.transfer(oThis.senderAddress, oThis.senderPassphrase,
      oThis.recipientAddress, oThis.amountInWei, {tag: oThis.tag, returnType: oThis.returnType});
    
  }
};

InstanceComposer.registerShadowableClass(TransferBrandedTokenKlass, "getTransferBrandedTokenService");

module.exports = TransferBrandedTokenKlass;
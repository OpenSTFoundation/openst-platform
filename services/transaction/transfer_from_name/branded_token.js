"use strict";

/**
 * Transfer Branded Token from Named Address
 *
 * @module services/transaction/transfer_from_name/branded_token
 */

const rootPrefix = '../../..'
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , fundManager = require(rootPrefix + '/lib/fund_manager')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

/**
 * Transfer Branded Token from Named Address Service
 *
 * @param {object} params - this is object with keys - erc20_address, reserve_address, reserve_passphrase,
 *                                                sender_name, recipient_address, amount_in_wei
 *
 * @constructor
 */
const TransferBrandedTokenByNameKlass = function(params) {
  const oThis = this
  ;

  oThis.erc20Address = params.erc20_address;
  oThis.reserveAddress = params.reserve_address;
  oThis.reservePassphrase = params.reserve_passphrase;
  oThis.senderName = params.sender_name;
  oThis.recipientAddress = params.recipient_address;
  oThis.amountInWei = params.amount_in_wei;
};

TransferBrandedTokenByNameKlass.prototype = {
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
        return Promise.resolve(responseHelper.error('s_t_tfn_bt_1', 'Unrecognized sender name'));
      }

      return fundManager.transferBrandedToken(oThis.erc20Address, oThis.reserveAddress, oThis.reservePassphrase,
        senderAddress, senderPassphrase, oThis.recipientAddress, oThis.amountInWei);

    } catch (err) {
      return Promise.resolve(responseHelper.error('s_t_tfn_bt_2', 'Something went wrong. ' + err.message));
    }
  }
};

module.exports = TransferBrandedTokenByNameKlass;
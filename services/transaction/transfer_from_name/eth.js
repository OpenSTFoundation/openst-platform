"use strict";

/**
 * Transfer Eth By name
 *
 * @module services/transaction/transfer_from_name/eth
 */

const rootPrefix = '../../..'
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , fundManager = require(rootPrefix + '/lib/fund_manager')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

/**
 * Transfer Eth by name Service
 *
 * @param {object} params - this is object with keys - sender_name, recipient_address, amount_in_wei
 *
 * @constructor
 */
const TransferEthByNameKlass = function(params) {
  const oThis = this
  ;

  oThis.senderName = params.sender_name;
  oThis.recipientAddress = params.recipient_address;
  oThis.amountInWei = params.amount_in_wei;
};

TransferEthByNameKlass.prototype = {
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
        return Promise.resolve(responseHelper.error('s_t_tfn_e_1', 'Unrecognized sender name'));
      }

      return fundManager.transferEth(senderAddress, senderPassphrase, oThis.recipientAddress, oThis.amountInWei);

    } catch (err) {
      return Promise.resolve(responseHelper.error('s_t_tfn_e_2', 'Something went wrong. ' + err.message));
    }
  }
};

module.exports = TransferEthByNameKlass;
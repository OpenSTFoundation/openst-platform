"use strict";

/**
 * Give Test Ost to Member company for simulator
 *
 * @module services/simulator/give_test_ost
 */

const BigNumber = require('bignumber.js')
;

const rootPrefix = '../..'
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , simpleTokenContractObj = require(rootPrefix + '/lib/contract_interact/simple_token')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

const etherToWeiConversion = new BigNumber(1000000000000000000)
  , senderUser = "foundation"
;

/**
 * Give Test Ost service
 *
 * @param {object} params - this is object with keys - receiver_address, value (in base unit)
 *
 * @constructor
 */
const GiveTestOstKlass = function(params){
  const oThis = this;

  oThis.receiverAddress = params.receiver_address;
  oThis.value = params.value;
};

GiveTestOstKlass.prototype = {

  /**
   * Perform<br><br>
   *
   * @return {promise<result>} - returns a promise which resolves to an object of kind Result
   */
  perform: async function() {
    const oThis = this
      // Get address and passphrase of user. In our case it would be foundation
      , senderAddress = coreAddresses.getAddressForUser(senderUser)
      , senderPassPhrase = coreAddresses.getPassphraseForUser(senderUser);

    // Check if amount of ost to transfer is number or not.
    if(isNaN(oThis.value)){
      return Promise.resolve(responseHelper.error('s_ft_gto_1', 'Invalid amount to transfer.'));
    }

    // Convert the given value in Wei.
    var amountInwei = (new BigNumber(oThis.value)).mul(etherToWeiConversion);

    // Call the simple token transfer method in async mode.
    // Wait for transaction hash for further lookup.
    var transactionHash = await simpleTokenContractObj.transfer(senderAddress, senderPassPhrase, oThis.receiverAddress,
      amountInwei, true);

    // Return Success
    return Promise.resolve(responseHelper.successWithData({transaction_hash: transactionHash}));

  }

};

module.exports = GiveTestOstKlass;
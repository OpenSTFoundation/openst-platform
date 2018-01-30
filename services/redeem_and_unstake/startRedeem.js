"use strict";

/**
 * Start the redeem process
 */

const BigNumber = require('bignumber.js')
;

const rootPrefix = '../..'
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , openSTValueContractInteractKlass = require(rootPrefix + '/lib/contract_interact/openst_value')
  , openSTUtilityContractInteractKlass = require(rootPrefix + '/lib/contract_interact/openst_utility')
  , coreConstants = require(rootPrefix + '/config/core_constants')
;

const openSTValueContractName = 'openSTValue'
  , openSTUtilityContractName = 'openSTUtility'
  , openSTValueContractAddress = coreAddresses.getAddressForContract(openSTValueContractName)
  , openSTUtilityContractAddress = coreAddresses.getAddressForContract(openSTUtilityContractName)
  , openSTValueContractInteract = new openSTValueContractInteractKlass(openSTValueContractAddress)
  , openSTUtilityContractInteract = new openSTUtilityContractInteractKlass(openSTUtilityContractAddress)
;

/**
 * Get nonce for redeeming
 *
 * @param {string} redeemerAddress - redeemer address
 *
 * @return {promise<number>}
 *
 */
const getNonceForRedeeming = function (redeemerAddress) {
  return openSTValueContractInteract.getNextNonce(redeemerAddress)
};

/**
 * is equal ignoring case
 *
 * @param {String} compareWith - string to compare with
 *
 * @return {Bool} true when equal
 */
String.prototype.equalsIgnoreCase = function (compareWith) {
  var _self = this.toLowerCase()
    , _compareWith = String(compareWith).toLowerCase();

  return _self == _compareWith;
};

/**
 * Start redeeming
 *
 * @param {string} beneficiary - beneficiary address
 * @param {number} toRedeemAmount - to redeem amount
 * @param {string} uuid - uuid of the branded token / st prime
 *
 * @return {promise<number>}
 *
 */
const startRedeem = async function (beneficiary, toRedeemAmount, uuid) {

  toRedeemAmount = new BigNumber(toRedeemAmount);

  const redeemerAddress = coreAddresses.getAddressForUser('redeemer')
    , redeemerPassphrase = coreAddresses.getPassphraseForUser('redeemer');

  const redeemerNonce = await getNonceForRedeeming(redeemerAddress);



  if (uuid.equalsIgnoreCase(coreConstants.OST_OPENSTUTILITY_ST_PRIME_UUID)) {
    return openSTUtilityContractInteract.redeemSTPrime(
      redeemerAddress,
      redeemerPassphrase,
      toRedeemAmount,
      redeemerNonce,
      beneficiary,
      true
    );
  } else {
    return openSTUtilityContractInteract.redeem(
      redeemerAddress,
      redeemerPassphrase,
      uuid,
      toRedeemAmount,
      redeemerNonce,
      beneficiary,
      true
    );
  }
};

module.exports = startRedeem;
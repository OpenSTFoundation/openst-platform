"use strict";

/**
 * Start the redeem process
 */

const BigNumber = require('bignumber.js')
;

const rootPrefix = '../..'
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , OpenSTValueKlass = require(rootPrefix + '/lib/contract_interact/openst_value')
  , OpenStUtilityKlass = require(rootPrefix + '/lib/contract_interact/openst_utility')
  , coreConstants = require(rootPrefix + '/config/core_constants')
;

const openSTValueContractName = 'openSTValue'
  , openSTUtilityContractName = 'openSTUtility'
  , openSTValueContractAddress = coreAddresses.getAddressForContract(openSTValueContractName)
  , openSTUtilityContractAddress = coreAddresses.getAddressForContract(openSTUtilityContractName)
  , openSTValueContractInteract = new OpenSTValueKlass(openSTValueContractAddress)
  , openSTUtilityContractInteract = new OpenStUtilityKlass(openSTUtilityContractAddress)
;

/**
 * Get nonce for redeeming
 *
 * @param {string} redeemerAddress - redeemer address
 *
 * @return {promise<result>}
 *
 */
const getNonceForRedeeming = function (redeemerAddress) {
  return openSTValueContractInteract.getNextNonce(redeemerAddress);
};

/**
 * is equal ignoring case
 *
 * @param {string} compareWith - string to compare with
 *
 * @return {booelan} true when equal
 */
String.prototype.equalsIgnoreCase = function (compareWith) {
  const oThis = this
    , _self = this.toLowerCase()
    , _compareWith = String(compareWith).toLowerCase();

  return _self === _compareWith;
};
/**
 * Start redeeming
 *
 * @param {string} beneficiary - beneficiary address
 * @param {number} toRedeemAmount - to redeem amount
 * @param {string} uuid - uuid of the branded token / st prime
 *
 * @return {promise}
 *
 */
const startRedeem = async function (beneficiary, toRedeemAmount, uuid) {

  toRedeemAmount = new BigNumber(toRedeemAmount);

  const redeemerAddress = coreAddresses.getAddressForUser('redeemer')
    , redeemerPassphrase = coreAddresses.getPassphraseForUser('redeemer');

  const redeemerNonceResponse = await getNonceForRedeeming(redeemerAddress);
  if (redeemerNonceResponse.isFailure()) {
    throw "Get next nounce failed";
  }
  const redeemerNonce = redeemerNonceResponse.data.nextNounce;

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
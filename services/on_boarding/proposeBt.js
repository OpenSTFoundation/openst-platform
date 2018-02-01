"use strict";

/**
 * Propose
 */

const rootPrefix = '../..'
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , OpenStUtilityKlass = require(rootPrefix + '/lib/contract_interact/openst_utility')
  , senderName = 'staker'
;

const contractName = 'openSTUtility'
  , currContractAddr = coreAddresses.getAddressForContract(contractName)
  , openSTUtilityContractInteract = new OpenStUtilityKlass(currContractAddr)
;

const proposeBt = function (symbol, name, conversionRate) {
  // returns a Promise which resolves to a transaction_hash
  return openSTUtilityContractInteract.proposeBrandedToken(
    coreAddresses.getAddressForUser(senderName),
    coreAddresses.getPassphraseForUser(senderName),
    symbol,
    name,
    conversionRate
  )
};

module.exports = proposeBt;
"use strict";

/**
 * Propose
 */

const rootPrefix = '..'
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , openSTUtilityContractInteractKlass = require(rootPrefix + '/lib/contract_interact/openst_utility')
  ;

const contractName = 'openSTUtility'
  , currContractAddr = coreAddresses.getAddressForContract(contractName)
  , openSTUtilityContractInteract = new openSTUtilityContractInteractKlass(currContractAddr)
  ;

const proposeBt = function (senderAddress, senderPassphrase, symbol, name, conversionRate) {
  // returns a Promise which resolves to a transaction_hash
  return openSTUtilityContractInteract.proposeBrandedToken(
    senderAddress,
    senderPassphrase,
    symbol,
    name,
    conversionRate
  )
};

module.exports = proposeBt;
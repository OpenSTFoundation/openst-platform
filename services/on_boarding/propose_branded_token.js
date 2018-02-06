"use strict";

/**
 * Propose Branded Token
 *
 * @module services/on_boarding/propose_branded_token
 */

const rootPrefix = '../..'
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , OpenStUtilityKlass = require(rootPrefix + '/lib/contract_interact/openst_utility')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

const senderName = 'staker'
  , openSTUtilityContractName = 'openSTUtility'
  , stakerAddr = coreAddresses.getAddressForUser(senderName)
  , stakerPassphrase = coreAddresses.getPassphraseForUser(senderName)
  , openSTUtilityContractAddress = coreAddresses.getAddressForContract(openSTUtilityContractName)
  , openSTUtility = new OpenStUtilityKlass(openSTUtilityContractAddress)
;

/**
 * Propose Branded Token Service
 *
 * @param {object} params - this is object with keys - symbol, name, conversionRate
 *
 * @constructor
 */
const ProposeBrandedTokenKlass = function(params) {
  const oThis = this
  ;

  oThis.symbol = params.symbol;
  oThis.name = params.name;
  oThis.conversionRate = params.conversion_rate;
};

ProposeBrandedTokenKlass.prototype = {
  /**
   * Perform<br><br>
   *
   * @return {promise<result>} - returns a promise which resolves to an object of kind Result
   */
  perform: async function() {
    try {
      const oThis = this
      ;

      const proposalTransactionHash = await openSTUtility.proposeBrandedToken(
        stakerAddr,
        stakerPassphrase,
        oThis.symbol,
        oThis.name,
        oThis.conversionRate
      );

      return responseHelper.successWithData({transaction_hash: proposalTransactionHash});

    } catch (err) {
      return Promise.resolve(responseHelper.error('s_ob_pbt_2', 'Something went wrong. ' + err.message));
    }
  }
};

module.exports = ProposeBrandedTokenKlass;
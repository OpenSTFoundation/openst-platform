"use strict";

/**
 * Propose Branded Token
 *
 * @module services/on_boarding/propose_branded_token
 */
const uuid = require('uuid');

const rootPrefix = '../..'
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , OpenStUtilityKlass = require(rootPrefix + '/lib/contract_interact/openst_utility')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
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
 * @param {object} params -
 * @param {string} params.name - Branded token name
 * @param {string} params.symbol - Branded token symbol
 * @param {string} params.conversion_factor - Conversion factor (1 OST = ? Branded token)
 *
 * @constructor
 */
const ProposeBrandedTokenKlass = function (params) {
  const oThis = this
  ;

  params = params || {};
  oThis.name = params.name;
  oThis.symbol = params.symbol;
  oThis.conversionFactor = params.conversion_factor;
  oThis.conversionRate = null;
  oThis.conversionRateDecimals = null;
};

ProposeBrandedTokenKlass.prototype = {
  /**
   * Perform<br><br>
   *
   * @return {promise<result>} - returns a promise which resolves to an object of kind Result
   */
  perform: async function () {
    const oThis = this
    ;

    try {
      //validations
      if (!basicHelper.isBTNameValid(oThis.name)) {
        let errObj = responseHelper.error({
          internal_error_identifier: 's_ob_pbt_1',
          api_error_identifier: 'invalid_branded_token_name',
          error_config: basicHelper.fetchErrorConfig()
        });

        return Promise.resolve(errObj);
      }
      if (!basicHelper.isBTSymbolValid(oThis.symbol)) {
        let errObj = responseHelper.error({
          internal_error_identifier: 's_ob_pbt_2',
          api_error_identifier: 'invalid_branded_token_symbol',
          error_config: basicHelper.fetchErrorConfig()
        });

        return Promise.resolve(errObj);
      }
      if (!basicHelper.isBTConversionFactorValid(oThis.conversionFactor)) {
        let errObj = responseHelper.error({
          internal_error_identifier: 's_ob_pbt_3',
          api_error_identifier: 'invalid_conversion_factor',
          error_config: basicHelper.fetchErrorConfig()
        });

        return Promise.resolve(errObj);
      }

      const conversionRateConversionResponse = basicHelper.convertConversionFactorToConversionRate(oThis.conversionFactor);

      if (conversionRateConversionResponse.isSuccess()) {

        oThis.conversionRate = conversionRateConversionResponse.data.conversionRate;
        oThis.conversionRateDecimals = conversionRateConversionResponse.data.conversionRateDecimals;

        const proposalRsp = await openSTUtility.proposeBrandedToken(stakerAddr, stakerPassphrase, oThis.symbol,
          oThis.name, oThis.conversionRate, oThis.conversionRateDecimals);

        if (proposalRsp.isSuccess()) {
          proposalRsp.data.transaction_uuid = uuid.v4();
        }

        return Promise.resolve(proposalRsp);

      } else {
        return Promise.resolve(conversionRateConversionResponse);
      }

    } catch (err) {
      let errObj = responseHelper.error({
        internal_error_identifier: 's_ob_pbt_4',
        api_error_identifier: 'something_went_wrong',
        error_config: basicHelper.fetchErrorConfig()
      });

      return Promise.resolve(errObj);
    }
  }
};

module.exports = ProposeBrandedTokenKlass;
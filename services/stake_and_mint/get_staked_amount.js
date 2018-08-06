'use strict';

/**
 * From SimpleStake Contract get all time staked amount
 *
 * @module services/stake_and_mint/get_staked_amount
 */

const rootPrefix = '../..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  basicHelper = require(rootPrefix + '/helpers/basic_helper'),
  logger = require(rootPrefix + '/helpers/custom_console_logger');

require(rootPrefix + '/lib/contract_interact/simple_stake');

/**
 * Constructor for get staked amount details class
 *
 * @param {object} params
 * @param {string} params.simple_stake_contract_address - simple stake contract address
 *
 * @constructor
 */
const GetStakeAmountKlass = function(params) {
  const oThis = this;

  params = params || {};
  oThis.simpleStakeContractAddress = params.simple_stake_contract_address;
};

GetStakeAmountKlass.prototype = {
  /**
   * Perform
   *
   * @return {promise<result>}
   */
  perform: function() {
    const oThis = this;

    return oThis.asyncPerform().catch(function(error) {
      if (responseHelper.isCustomResult(error)) {
        return error;
      } else {
        logger.error('openst-platform::services/stake_and_mint/get_staked_amount.js::perform::catch');
        logger.error(error);

        return responseHelper.error({
          internal_error_identifier: 's_sam_gsa_1',
          api_error_identifier: 'something_went_wrong',
          error_config: basicHelper.fetchErrorConfig(),
          debug_options: { err: error }
        });
      }
    });
  },

  /**
   * asyncPerform
   *
   * @return {promise<result>}
   */
  asyncPerform: function() {
    const oThis = this;

    // validations
    if (!basicHelper.isAddressValid(oThis.simpleStakeContractAddress)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 's_sam_gsa_2',
        api_error_identifier: 'invalid_address',
        error_config: basicHelper.fetchErrorConfig()
      });
      return Promise.resolve(errObj);
    }

    const SimpleStakeInteractKlass = oThis.ic().getSimpleStakeInteractClass(),
      simpleStake = new SimpleStakeInteractKlass({ contractAddress: oThis.simpleStakeContractAddress });

    return simpleStake.getAlltimeStakedAmount();
  }
};

InstanceComposer.registerShadowableClass(GetStakeAmountKlass, 'getGetStakeAmountService');

module.exports = GetStakeAmountKlass;

"use strict";

/**
 * Approve OpenSTValue contract for starting the stake and mint process.
 *
 * @module services/stake_and_mint/start_stake
 */

const uuid = require('uuid');

const rootPrefix = '../..'
  , InstanceComposer = require( rootPrefix + "/instance_composer")
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;

require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/lib/contract_interact/openst_value');

/**
 * Start Stake Service constructor
 *
 * @param {object} params -
 * @param {string} params.beneficiary - Staked amount beneficiary address
 * @param {number} params.to_stake_amount - Amount (in wei) to stake
 * @param {string} params.uuid - Branded Token UUID
 *
 * @constructor
 */
const startStakeKlass = function (params) {
  const oThis = this
  ;

  params = params || {};
  oThis.beneficiary = params.beneficiary;
  oThis.toStakeAmount = params.to_stake_amount;
  oThis.uuid = params.uuid;
};

startStakeKlass.prototype = {
  /**
   * Perform
   *
   * @return {promise<result>}
   */
  perform: async function () {

    const oThis = this
      , coreAddresses = oThis.ic().getCoreAddresses()
    ;

    try {
      const stakerAddress = coreAddresses.getAddressForUser('staker')
        , stakerPassphrase = coreAddresses.getPassphraseForUser('staker');

      // Validations
      if (!basicHelper.isAddressValid(stakerAddress) || !stakerPassphrase) {
        let errObj = responseHelper.error({
          internal_error_identifier: 's_sam_ss_1',
          api_error_identifier: 'invalid_staker_details',
          error_config: basicHelper.fetchErrorConfig()
        });
        return Promise.resolve(errObj);
      }
      if (!basicHelper.isAddressValid(oThis.beneficiary)) {
        let errObj = responseHelper.error({
          internal_error_identifier: 's_sam_ss_2',
          api_error_identifier: 'invalid_beneficiary_details',
          error_config: basicHelper.fetchErrorConfig()
        });
        return Promise.resolve(errObj);
      }
      if (!basicHelper.isUuidValid(oThis.uuid)) {
        let errObj = responseHelper.error({
          internal_error_identifier: 's_sam_ss_3',
          api_error_identifier: 'invalid_branded_token_uuid',
          error_config: basicHelper.fetchErrorConfig()
        });
        return Promise.resolve(errObj);
      }
      if (!basicHelper.isNonZeroWeiValid(oThis.toStakeAmount)) {
        let errObj = responseHelper.error({
          internal_error_identifier: 's_sam_ss_4',
          api_error_identifier: 'invalid_amount',
          error_config: basicHelper.fetchErrorConfig()
        });
        return Promise.resolve(errObj);
      }

      // Format wei
      oThis.toStakeAmount = basicHelper.formatWeiToString(oThis.toStakeAmount);

      const OpenSTValueKlass = oThis.ic().getOpenSTValueInteractClass()
        , openSTValueContractInteract = new OpenSTValueKlass()
      ;

      const stakeTransactionHash = await openSTValueContractInteract.stake(stakerAddress, stakerPassphrase, oThis.uuid,
        oThis.toStakeAmount, oThis.beneficiary, true);

      return Promise.resolve(responseHelper.successWithData({
        transaction_uuid: uuid.v4(),
        transaction_hash: stakeTransactionHash
      }));

    } catch (err) {
      let errObj = responseHelper.error({
        internal_error_identifier: 's_sam_ss_5',
        api_error_identifier: 'something_went_wrong',
        error_config: basicHelper.fetchErrorConfig()
      });
      return Promise.resolve(errObj);
    }
  }
};

InstanceComposer.registerShadowableClass(startStakeKlass, "getStartStakeService");

module.exports = startStakeKlass;
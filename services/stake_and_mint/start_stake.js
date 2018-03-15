"use strict";

/**
 * Approve OpenSTValue contract for starting the stake and mint process.
 *
 * @module services/stake_and_mint/start_stake
 */

const uuid = require('uuid');

const rootPrefix = '../..'
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , OpenSTValueKlass = require(rootPrefix + '/lib/contract_interact/openst_value')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;

const openSTValueContractInteract = new OpenSTValueKlass()
;

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
const startStakeKlass = function(params) {
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
    ;

    try {
      const stakerAddress = coreAddresses.getAddressForUser('staker')
        , stakerPassphrase = coreAddresses.getPassphraseForUser('staker');

      // Validations
      if (!basicHelper.isAddressValid(stakerAddress) || !stakerPassphrase) {
        return Promise.resolve(responseHelper.error('s_sam_ss_1', 'Invalid staker details'));
      }
      if (!basicHelper.isAddressValid(oThis.beneficiary)) {
        return Promise.resolve(responseHelper.error('s_sam_ss_2', 'Invalid beneficiary details'));
      }
      if (!basicHelper.isUuidValid(oThis.uuid)) {
        return Promise.resolve(responseHelper.error('s_sam_ss_3', 'Invalid branded token uuid'));
      }
      if (!basicHelper.isNonZeroWeiValid(oThis.toStakeAmount)) {
        return Promise.resolve(responseHelper.error('s_sam_ss_4', 'Invalid amount'));
      }

      // Format wei
      oThis.toStakeAmount = basicHelper.formatWeiToString(oThis.toStakeAmount);

      const stakeTransactionHash = await openSTValueContractInteract.stake(stakerAddress, stakerPassphrase, oThis.uuid,
        oThis.toStakeAmount, oThis.beneficiary, true);

      return Promise.resolve(responseHelper.successWithData({transaction_uuid: uuid.v4(), transaction_hash: stakeTransactionHash}));

    } catch (err) {
      return Promise.resolve(responseHelper.error('s_sam_ss_5', 'Something went wrong. ' + err.message));
    }
  }
};

module.exports = startStakeKlass;
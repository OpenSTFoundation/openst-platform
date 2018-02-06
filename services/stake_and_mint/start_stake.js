"use strict";

/**
 * Approve OpenSTValue contract for starting the stake and mint process.
 */

const BigNumber = require('bignumber.js')
;

const rootPrefix = '../..'
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , OpenSTValueKlass = require(rootPrefix + '/lib/contract_interact/openst_value')
;

const openSTValueContractInteract = new OpenSTValueKlass()
;

/**
 * Start Stake Service constructor
 *
 * @constructor
 */
const startStakeKlass = function(params) {
  const oThis = this
  ;

  oThis.beneficiary = params.beneficiary;
  oThis.toStakeAmount = new BigNumber(params.to_stake_amount);
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

      const stakeTransactionHash = await openSTValueContractInteract.stake(
        stakerAddress,
        stakerPassphrase,
        oThis.uuid,
        oThis.toStakeAmount.toString(10),
        oThis.beneficiary,
        true
      );

      return Promise.resolve(responseHelper.successWithData({transaction_hash: stakeTransactionHash}));

    } catch (err) {
      return Promise.resolve(responseHelper.error('s_sam_ss_1', 'Something went wrong. ' + err.message));
    }
  }
};

module.exports = startStakeKlass;
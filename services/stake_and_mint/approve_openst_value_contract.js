"use strict";

/**
 * Approve OpenSTValue contract for starting the stake and mint process.
 *
 * @module services/stake_and_mint/approve_openst_value_contract
 */

const BigNumber = require('bignumber.js')
;

const rootPrefix = '../..'
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , simpleToken = require(rootPrefix + '/lib/contract_interact/simple_token')
;

const openSTValueContractName = 'openSTValue'
  , openSTValueContractAddress = coreAddresses.getAddressForContract(openSTValueContractName)
  , stakerAddress = coreAddresses.getAddressForUser('staker')
  , stakerPassphrase = coreAddresses.getPassphraseForUser('staker')
;

/**
 * Approve OpenST Value Contract Service
 *
 * @constructor
 */
const ApproveOpenstValueContractKlass = function() {};

ApproveOpenstValueContractKlass.prototype = {

  /**
   * Perform
   *
   * @return {promise<result>}
   */
  perform: async function () {
    const oThis = this
    ;

    try {
      const bigBalance = await oThis._getStakerSTBalance();

      const transactionHash = await oThis._approve(bigBalance);

      return Promise.resolve(responseHelper.successWithData({transaction_hash: transactionHash}));

    } catch (err) {
      return Promise.resolve(responseHelper.error('s_sam_aovc_1', 'Something went wrong. ' + err.message));
    }
  },

  /**
   * Approve OpenSTValue contract for starting the stake and mint process.
   *
   * @param {BigNumber} toApproveAmount - this is the amount which is used for approval
   *
   * @return {promise<result>}
   */
  _approve: async function (toApproveAmount) {
    const transactionHash = await simpleToken.approve(
      stakerAddress,
      stakerPassphrase,
      openSTValueContractAddress,
      toApproveAmount,
      true // we need this to be done in async and not to wait for the tx to get mined.
    );

    return Promise.resolve(transactionHash);
  },

  /**
   * Get ST balance of staker
   *
   * @return {promise<BigNumber>}
   */
  _getStakerSTBalance: function() {
    return simpleToken.balanceOf(stakerAddress)
      .then(function (result) {
        const stBalance = result.data['balance'];

        return new BigNumber(stBalance);
      })
  },

};

module.exports = ApproveOpenstValueContractKlass;
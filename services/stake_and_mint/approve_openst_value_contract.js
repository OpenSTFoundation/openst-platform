"use strict";

/**
 * Approve OpenSTValue contract for starting the stake and mint process.
 *
 * @module services/stake_and_mint/approve_openst_value_contract
 */

const BigNumber = require('bignumber.js')
  , uuid = require('uuid');
;

const rootPrefix = '../..'
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , simpleToken = require(rootPrefix + '/lib/contract_interact/simple_token')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;

const openSTValueContractName = 'openSTValue'
  , openSTValueContractAddress = coreAddresses.getAddressForContract(openSTValueContractName)
  , stakerAddress = coreAddresses.getAddressForUser('staker')
  , stakerPassphrase = coreAddresses.getPassphraseForUser('staker')
;

/**
 * Approve OpenST Value Contract Service
 *
 * @param {object} params -
 * @param {object} params.options -
 * @param {string} params.options.returnType - Desired return type. possible values: uuid, txHash, txReceipt. Default: txHash
 *
 * @constructor
 */
const ApproveOpenstValueContractKlass = function (params) {

  const oThis = this
  ;

  params = params || {};
  params.options = params.options || {};

  if (params.options.returnType === 'txReceipt') {
    oThis.runInAsync = false;
  } else {
    oThis.runInAsync = true;
  }

};

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

      var approveRsp = await oThis._approve(bigBalance);
      approveRsp.transaction_uuid = uuid.v4();

      return Promise.resolve(approveRsp);

    } catch (err) {
      let errObj = responseHelper.error({
        internal_error_identifier: 's_sam_aovc_1',
        api_error_identifier: 'something_went_wrong',
        error_config: basicHelper.fetchErrorConfig()
      });

      return Promise.resolve(errObj);
    }
  },

  /**
   * Approve OpenSTValue contract for starting the stake and mint process.
   *
   * @param {BigNumber} toApproveAmount - this is the amount which is used for approval
   *
   * @return {promise<result>}
   * @private
   * @ignore
   */
  _approve: async function (toApproveAmount) {

    const oThis = this
    ;

    const approveRsp = await simpleToken.approve(
      stakerAddress,
      stakerPassphrase,
      openSTValueContractAddress,
      toApproveAmount,
      oThis.runInAsync
    );

    return Promise.resolve(approveRsp);

  },

  /**
   * Get ST balance of staker
   *
   * @return {promise<result>}
   * @private
   * @ignore
   */
  _getStakerSTBalance: function () {
    return simpleToken.balanceOf(stakerAddress)
      .then(function (result) {
        const stBalance = result.data['balance'];

        return new BigNumber(stBalance);
      })
  },

};

module.exports = ApproveOpenstValueContractKlass;
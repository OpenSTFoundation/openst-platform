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
  , InstanceComposer = require(rootPrefix + "/instance_composer")
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;

require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/lib/contract_interact/simple_token');

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
    , coreAddresses = oThis.ic().getCoreAddresses()
    
    , openSTValueContractName = 'openSTValue'
  ;

  params = params || {};
  params.options = params.options || {};

  if (params.options.returnType === 'txReceipt') {
    oThis.runInAsync = false;
  } else {
    oThis.runInAsync = true;
  }
  
  oThis.openSTValueContractAddress = coreAddresses.getAddressForContract(openSTValueContractName);
  oThis.stakerAddress = coreAddresses.getAddressForUser('staker');
  oThis.stakerPassphrase = coreAddresses.getPassphraseForUser('staker');

};

ApproveOpenstValueContractKlass.prototype = {

  /**
   * Perform
   *
   * @return {promise<result>}
   */
  perform: function () {
    const oThis = this;

    return oThis.asyncPerform()
      .catch(function (error) {
        if (responseHelper.isCustomResult(error)) {
          return error;
        } else {
          logger.error('openst-platform::services/on_boarding/get_registration_status.js::perform::catch');
          logger.error(error);

          return responseHelper.error({
            internal_error_identifier: 's_ob_grs_3',
            api_error_identifier: 'something_went_wrong',
            error_config: basicHelper.fetchErrorConfig(),
            debug_options: {err: error}
          });
        }
      });
  },

  /**
   * Async Perform
   *
   * @return {promise<result>}
   */
  asyncPerform: async function () {
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
      , SimpleTokenKlass = oThis.ic().getSimpleTokenInteractClass()
      , simpleToken = new SimpleTokenKlass()
    ;

    const approveRsp = await simpleToken.approve(
      oThis.stakerAddress,
      oThis.stakerPassphrase,
      oThis.openSTValueContractAddress,
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
    
    const oThis = this
      , SimpleTokenKlass = oThis.ic().getSimpleTokenInteractClass()
      , simpleToken   = new SimpleTokenKlass()
    ;
    
    return simpleToken.balanceOf(oThis.stakerAddress)
      .then(function (result) {
        const stBalance = result.data['balance'];

        return new BigNumber(stBalance);
      })
  },

};

InstanceComposer.registerShadowableClass(ApproveOpenstValueContractKlass, "getApproveOpenstValueContractService");

module.exports = ApproveOpenstValueContractKlass;
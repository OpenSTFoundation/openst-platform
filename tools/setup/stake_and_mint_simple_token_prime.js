"use strict";

/**
 * Stake and mint ST Prime
 *
 * @module tools/setup/stake_and_mint_stp
 */

const BigNumber = require('bignumber.js')
;

const rootPrefix = "../.."
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , approveService = require(rootPrefix + '/services/stake_and_mint/approve_openst_value_contract')
  , getApprovalStatusService = require(rootPrefix + '/services/stake_and_mint/get_approval_status')
  , startStakeService = require(rootPrefix + '/services/stake_and_mint/start_stake')
  , fundManager = require(rootPrefix + '/tools/setup/fund_manager')
;

const stakerAddr = coreAddresses.getAddressForUser('staker')
  , utilityChainOwnerAddr = coreAddresses.getAddressForUser('utilityChainOwner')
  , utilityChainOwnerPassphrase = coreAddresses.getPassphraseForUser('utilityChainOwner')
;

/**
 * Constructor for Deploy simple token contract
 *
 * @constructor
 */
const StakeAndMintSimpleTokenPrime = function () {
};

StakeAndMintSimpleTokenPrime.prototype = {
  /**
   * Perform
   *
   * @return {promise<result>}
   */
  perform: async function () {
    logger.step("** Starting stake mint for st prime for beneficiary utilityChainOwner");
    const oThis = this
      , toStakeAmount = (new BigNumber(10000)).mul(new BigNumber(10).toPower(18))
    ;

    logger.info('* Utility Chain Owner transfers ST to staker');
    await fundManager.transferST(utilityChainOwnerAddr, utilityChainOwnerPassphrase, stakerAddr, toStakeAmount);

    logger.info('* Staker approves openSTValue contract');
    const approveResponse = await (new approveService()).perform();
    if (approveResponse.isFailure()) {
      process.exit(1);
    }

    const approveTransactionHash = approveResponse.data.transaction_hash;

    logger.info('* Get approval status and keep doing so till success');
    await oThis._getApprovalStatus(approveTransactionHash);

    logger.info('* Start stake');

    await (new startStakeService({
      beneficiary: utilityChainOwnerAddr,
      to_stake_amount: toStakeAmount,
      uuid: coreConstants.OST_OPENSTUTILITY_ST_PRIME_UUID
    })).perform();

    logger.info('* Wait for credit of ST\' to beneficiary');
    await oThis._waitForSTPrimeMint();

    return Promise.resolve(responseHelper.successWithData({}));
  },

  /**
   * Get approval status
   *
   * @param {string} approveTransactionHash - transaction hash of the approval
   *
   * @return {promise}
   */
  _getApprovalStatus: function(approveTransactionHash) {
    return new Promise(function(onResolve, onReject) {

      const getStatus = async function(){

        const getApprovalStatusResponse = await (new getApprovalStatusService({
          transaction_hash: approveTransactionHash})).perform();

        if(getApprovalStatusResponse.isSuccess()){
          return onResolve(getApprovalStatusResponse);
        } else {
          setTimeout(getStatus, 10000);
        }
      };

      getStatus();
    });
  },

  /**
   * Wait for ST Prime mint
   *
   * @return {promise}
   */
  _waitForSTPrimeMint: function() {
    return new Promise(function(onResolve, onReject) {

      const getBalance = async function(){

        const getSTPBalanceResponse = await fundManager.getSTPrimeBalanceOf(utilityChainOwnerAddr);

        if(getSTPBalanceResponse.isSuccess() && (new BigNumber(getSTPBalanceResponse.data.balance)).greaterThan(0)){
          return onResolve(getSTPBalanceResponse);
        } else {
          setTimeout(getBalance, 10000);
        }
      };

      getBalance();
    });
  }
};

module.exports = new StakeAndMintSimpleTokenPrime();
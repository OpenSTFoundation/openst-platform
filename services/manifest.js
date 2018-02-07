"use strict";

/**
 * Service manifest
 *
 * @module services/manifest
 */

const rootPrefix = ".."
  , getTransactionReceipt = require(rootPrefix + '/services/transaction/get_receipt')
  , transferBrandedToken = require(rootPrefix + '/services/transaction/transfer_branded_token')
  , transferSimpleToken = require(rootPrefix + '/services/transaction/transfer_simple_token')
  , transferSimpleTokenPrime = require(rootPrefix + '/services/transaction/transfer_simple_token_prime')
  , proposeBrandedToken = require(rootPrefix + '/services/on_boarding/propose_branded_token')
  , getRegistrationStatus = require(rootPrefix + '/services/on_boarding/get_registration_status')
  , approveForStake = require(rootPrefix + '/services/stake_and_mint/approve_openst_value_contract')
  , getApprovalStatusForStake = require(rootPrefix + '/services/stake_and_mint/get_approval_status')
  , startStake = require(rootPrefix + '/services/stake_and_mint/start_stake')
  , approveForRedeem = require(rootPrefix + '/services/redeem_and_unstake/approveOpenStUtilityContract')
  , getApprovalStatusForRedeem = require(rootPrefix + '/services/redeem_and_unstake/getApprovalStatus')
  , startRedeem = require(rootPrefix + '/services/redeem_and_unstake/startRedeem')
  , generateAddress = require(rootPrefix + '/services/utils/generate_address')
  , platformStatus = require(rootPrefix + '/services/utils/platform_status')
  , giveTestOst = require(rootPrefix + '/services/simulator/give_test_ost')
;

/**
 * Service Manifest Constructor
 *
 * @constructor
 */
const ServiceManifestKlass = function() {};

ServiceManifestKlass.prototype = {
  /**
   * Transactions related services
   *
   * @constant {object}
   */
  transactions: {
    getTransactionReceipt: getTransactionReceipt,
    transferBrandedToken: transferBrandedToken,
    transferSimpleToken:transferSimpleToken,
    transferSimpleTokenPrime: transferSimpleTokenPrime
  },

  /**
   * On-Boarding related services
   *
   * @constant {object}
   */
  onBoarding: {
    proposeBrandedToken: proposeBrandedToken,
    getRegistrationStatus: getRegistrationStatus
  },

  /**
   * Stake related services
   *
   * @constant {object}
   */
  stake: {
    approveForStake: approveForStake,
    getApprovalStatus: getApprovalStatusForStake,
    start: startStake
  },

  /**
   * Redeem related services
   *
   * @constant {object}
   */
  redeem: {
    approveForRedeem: approveForRedeem,
    getApprovalStatus: getApprovalStatusForRedeem,
    start: startRedeem
  },

  /**
   * Utils services
   *
   * @constant {object}
   */
  utils: {
    generateAddress: generateAddress,
    platformStatus: platformStatus
  },

  /**
   * Simulator specificservices
   *
   * @constant {object}
   */
  simulator: {
    giveTestOst: giveTestOst
  }
};

module.exports = new ServiceManifestKlass();
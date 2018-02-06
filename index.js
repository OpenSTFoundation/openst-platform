"use strict";

/**
 * Load openST Platform module
 */

const rootPrefix = "."
  , version = require(rootPrefix + '/package.json').version
  , BrandedTokenKlass = require(rootPrefix + "/lib/contract_interact/branded_token")
  , proposeBrandedToken = require(rootPrefix + '/services/on_boarding/propose_branded_token')
  , getRegistrationStatus = require(rootPrefix + '/services/on_boarding/get_registration_status')
  , approveForStake = require(rootPrefix + '/services/stake_and_mint/approve_openst_value_contract')
  , getApprovalStatusForStake = require(rootPrefix + '/services/stake_and_mint/get_approval_status')
  , startStake = require(rootPrefix + '/services/stake_and_mint/start_stake')
  , generateAddress = require(rootPrefix + '/services/utils/generate_address')
  , platformStatus = require(rootPrefix + '/services/utils/platform_status')
  , getTransactionReceipt = require(rootPrefix + '/services/transaction/getTransactionReceipt')
  , transferBt = require(rootPrefix + '/services/transaction/transferBt')

  , approveForRedeem = require(rootPrefix + '/services/redeem_and_unstake/approveOpenStUtilityContract')
  , getApprovalStatusForRedeem = require(rootPrefix + '/services/redeem_and_unstake/getApprovalStatus')
  , startRedeem = require(rootPrefix + '/services/redeem_and_unstake/startRedeem')
  ;

const OpenSTPlatform = function () {
  const oThis = this;

  oThis.version = version;

  oThis.contracts = {};
  oThis.contracts.brandedToken = BrandedTokenKlass;

  oThis.services = {
    transactions: {
      getTransactionRecipt: getTransactionReceipt,
      transferBt: transferBt
    },
    onBoarding: {
      proposeBrandedToken: proposeBrandedToken,
      getRegistrationStatus: getRegistrationStatus
    },
    stake: {
      approveForStake: approveForStake,
      getApprovalStatus: getApprovalStatusForStake,
      start: startStake
    },
    redeem: {
      approveForRedeem: approveForRedeem,
      getApprovalStatus: getApprovalStatusForRedeem,
      start: startRedeem
    },
    utils: {
      generateAddress: generateAddress,
      platformStatus: platformStatus
    }
  };
};

module.exports = new OpenSTPlatform();
/**
 * Index File of openst-platform node module
 */

"use strict";

const rootPrefix = "."
  , version = require(rootPrefix + '/package.json').version
  , btContract = require(rootPrefix + "/lib/contract_interact/branded_token")
  , transactionLogger = require(rootPrefix + "/helpers/transactionLogger")
  , address = require(rootPrefix + '/services/address')
  , proposeBt = require(rootPrefix + '/services/on_boarding/proposeBt')
  , getRegistrationStatus = require(rootPrefix + '/services/on_boarding/getRegistrationStatus')
  , approveForStake = require(rootPrefix + '/services/stake_and_mint/approveOpenStValueContract')
  , getApprovalStatus = require(rootPrefix + '/services/stake_and_mint/getApprovalStatus')
  , startStake = require(rootPrefix + '/services/stake_and_mint/startStake')
  ;

const OpenSTPlatform = function () {
  const oThis = this;

  oThis.version = version;

  oThis.contracts = {};
  oThis.contracts.brandedToken = btContract;

  oThis.services = {
    address: address,
    onBoarding: {
      proposeBt: proposeBt,
      getRegistrationStatus: getRegistrationStatus
    },
    stake: {
      approveForStake: approveForStake,
      getApprovalStatus: getApprovalStatus,
      start: startStake
    }
  };

  oThis.helpers = {};
  oThis.helpers.transactionLogger = transactionLogger;
};

module.exports = new OpenSTPlatform();


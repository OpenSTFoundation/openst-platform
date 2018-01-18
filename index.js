/**
 * Index File of openst-platform node module
 */

"use strict";

const rootPrefix = "."
  , version = require(rootPrefix + '/package.json').version
  , btContract = require(rootPrefix + "/lib/contract_interact/branded_token")
  , transactionLogger = require(rootPrefix + "/helpers/transactionLogger")
  , address = require(rootPrefix + '/services/address')
  , proposeBt = require(rootPrefix + '/services/proposeBt');

const OpenSTPlatform = function () {
  const oThis = this;

  oThis.version = version;

  oThis.contracts = {};
  oThis.contracts.brandedToken = btContract;

  oThis.services = {
    address: address,
    proposeBt: proposeBt
  };

  oThis.helpers = {};
  oThis.helpers.transactionLogger = transactionLogger;
};

module.exports = OpenSTPlatform;


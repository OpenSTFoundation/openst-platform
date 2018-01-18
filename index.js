/**
 * Index File of openst-platform node module
 */

"use strict";

const rootPrefix = "."
  , version = require(rootPrefix + '/package.json').version
  , btContract = require(rootPrefix + "/lib/contract_interact/branded_token")
  , transactionLogger = require(rootPrefix + "/helpers/transactionLogger")
  , address = require(rootPrefix + '/services/address');

var OpenSTPlatform = function () {
  var oThis = this;

  oThis.version = version;

  oThis.contracts = {};
  oThis.contracts.brandedToken = btContract;

  // address related services.
  oThis.address = address;

  oThis.helpers = {};
  oThis.helpers.transactionLogger = transactionLogger;
};

module.exports = OpenSTPlatform;


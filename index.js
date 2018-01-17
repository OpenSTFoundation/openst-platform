/**
 * Index File of openst-platform node module
 */

"use strict";

const reqPrefix = "."
  , version = require(reqPrefix + 'package.json').version
  , btContract = require(reqPrefix + "/lib/contract_interact/branded_token")
  , transactionLogger = require(reqPrefix + "/helpers/transactionLogger");

var OpenSTPlatform = function () {
  var oThis = this;

  oThis.version = version;

  oThis.contracts = {};
  oThis.contracts.brandedToken = btContract;

  oThis.helpers = {};
  oThis.helpers.transactionLogger = transactionLogger;
};

module.exports = OpenSTPlatform;


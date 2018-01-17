/**
 * Index File of openst-platform node module
 */

"use strict";

const reqPrefix = "."
  , version = require(reqPrefix + 'package.json').version
  , btContract = require(reqPrefix + "/lib/contract_interact/branded_token");

var OpenSTPlatform = function () {
  var oThis = this;

  oThis.version = version;

  oThis.contracts = {};
  oThis.contracts.brandedToken = btContract;
};

module.exports = OpenSTPlatform;


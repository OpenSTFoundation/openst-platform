/**
 * Index File of openst-platform node module
 */

"use strict";

const reqPrefix = ".";

var OpenSTPlatform = function () {
  var oThis = this;

  oThis.version = require('package.json').version;

  oThis.contracts = {};
  oThis.contracts.brandedToken = require(reqPrefix + "/lib/contract_interact/branded_token");
};

module.exports = OpenSTPlatform;

